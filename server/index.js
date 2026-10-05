import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { SYSTEM_PROMPT } from './chatbotPrompt.js';
import { SYSTEM_PROMPT as SEARCH_EXPAND_PROMPT } from './searchExpandPrompt.js';
import {
  cashfreeConfig,
  cashfreeHeaders,
  creditVerifiedPayment,
  customerId,
  digitsPhone,
  fetchPaidPayment,
  merchantOrderId,
  verifyWebhookSignature,
} from './cashfree.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 8080;

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';

const app = express();
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

function uuid() {
  return crypto.randomUUID();
}

function jsonRes(res, body, status = 200) {
  return res.status(status).json(body);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/ai-chatbot', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const {
      message,
      user_id,
      user_name,
      user_location,
      language,
      session_id,
    } = req.body ?? {};

    if (session_id && user_id) {
      const { data: sessionInfo } = await supabase
        .from('chatbot_sessions')
        .select('user_id')
        .eq('id', session_id)
        .single();

      if (sessionInfo && sessionInfo.user_id !== user_id) {
        return jsonRes(res, { error: 'Unauthorized session access' }, 403);
      }
    }

    let conversation_history = [];
    if (session_id) {
      const { data: historyData } = await supabase
        .from('chatbot_messages')
        .select('content, is_user')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (historyData) {
        conversation_history = historyData.map((msg) => ({
          role: msg.is_user ? 'user' : 'assistant',
          content: msg.content,
        }));
        if (
          conversation_history.length > 0
          && conversation_history[conversation_history.length - 1].content === message
        ) {
          conversation_history.pop();
        }
      }
    }

    const IST_OFFSET_MS = 330 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const startOfIstLocalMs = Math.floor((nowMs + IST_OFFSET_MS) / dayMs) * dayMs;
    const startOfDay = new Date(startOfIstLocalMs - IST_OFFSET_MS);

    if (user_id) {
      const { count } = await supabase
        .from('chatbot_messages')
        .select('id, chatbot_sessions!inner(user_id)', { count: 'exact', head: true })
        .eq('is_user', true)
        .eq('chatbot_sessions.user_id', user_id)
        .gte('created_at', startOfDay.toISOString());

      if (count !== null && count >= 30) {
        return jsonRes(res, {
          reply: language === 'te'
            ? 'మీరు ఈ రోజు పరిమితిని దాటారు (30 సందేశాలు). దయచేసి రేపు మళ్ళీ ప్రయత్నించండి.'
            : 'You have reached your daily limit of 30 messages. Please try again tomorrow.',
          suggested_products: [],
          action_type: null,
        });
      }
    }

    const suggestedProducts = [];
    const lowerMessage = String(message ?? '').toLowerCase();

    const messages = [
      ...conversation_history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: `User: ${user_name}${user_location ? ` (Location: ${user_location})` : ''}\nPreferred Response Language: ${language === 'te' ? 'Telugu (తెలుగు)' : 'English'}\n\nMessage: ${message}`,
      },
    ];

    const groqMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    if (!GROQ_API_KEY) {
      return jsonRes(res, {
        reply: language === 'te'
          ? 'క్షమించండి, AI సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కొద్దిసేపట్లో మళ్ళీ ప్రయత్నించండి.'
          : 'Sorry, the AI service is temporarily unavailable. Please try again in a moment.',
        suggested_products: [],
        action_type: null,
      });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.3,
        top_p: 0.9,
      }),
    });

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error(`Groq API error (${groqResponse.status}): ${errorBody}`);
      return jsonRes(res, {
        reply: language === 'te'
          ? 'క్షమించండి, AI సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కొద్దిసేపట్లో మళ్ళీ ప్రయత్నించండి.'
          : 'Sorry, the AI service is temporarily unavailable. Please try again in a moment.',
        suggested_products: [],
        action_type: null,
      });
    }

    const aiResult = await groqResponse.json();
    const reply = aiResult.choices?.[0]?.message?.content
      || "I'm sorry, I couldn't process your request right now. Please try again.";

    let actionType = null;
    const workforceKeywords = [
      'worker', 'workers', 'hire', 'labour', 'labor', 'register',
      'registration', 'workforce', 'construction', 'hamali', 'plumber',
      'plumbing', 'electrician', 'cook', 'operator', 'farm worker', 'group registration',
      'single registration', 'bottleneck', 'job pin', 'accept order',
      'finish job', 'end date', 'booking end', 'auto-expire', 'auto expire',
      'completed orders', 'my orders', 'cancelled order', 'rejected order',
      'where did my order', 'pin deadline',
      'కార్మిక', 'నియమించ', 'నమోదు', 'శ్రమ', 'నిర్మాణ', 'హమాలి',
      'ఎలక్ట్రీషియన్', 'పూర్తయిన', 'ఆర్డర్',
    ];
    const jobsKeywords = [
      'jobs tab', 'my jobs', 'completed orders', 'my orders', 'sales tab',
      'purchases', 'order card', 'where is my order', 'disappeared',
      'report issue', 'rating', 'rate', 'pay now', 'payment history',
      'home delivery', 'filter', 'property', 'lease', 'feedback',
      'edit profile', 'cultivator', 'cutivator', 'pooling', 'solo',
      'revoke', 'gpay', 'phonepe', 'paytm', 'villa', 'borewells',
      'ఉద్యోగ', 'పూర్తయిన ఆర్డర్', 'శోధించు',
    ];
    const isWorkforceQuery = workforceKeywords.some((kw) => lowerMessage.includes(kw));
    const isJobsQuery = jobsKeywords.some((kw) => lowerMessage.includes(kw));

    if (suggestedProducts.length > 0) {
      actionType = 'product_suggestion';
    } else if (isWorkforceQuery || isJobsQuery) {
      actionType = isWorkforceQuery ? 'workforce_guide' : 'app_guide';
    } else if (
      lowerMessage.includes('how to')
      || lowerMessage.includes('how do')
      || lowerMessage.includes('ఎలా')
    ) {
      actionType = 'app_guide';
    }

    return jsonRes(res, {
      reply,
      suggested_products: suggestedProducts,
      action_type: actionType,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    return jsonRes(res, {
      reply: "I'm having trouble connecting right now. Please check your internet and try again.",
      suggested_products: [],
      action_type: null,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

async function createCashfreeOrder(req, res) {
  try {
    const { appId, secretKey, env, baseUrl, testMode } = cashfreeConfig();
    if (!appId || !secretKey) {
      return jsonRes(res, { error: 'Cashfree is not configured on the server' }, 500);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return jsonRes(res, { error: 'Unauthorized' }, 401);
    }

    const {
      amount,
      user_id,
      user_name,
      user_phone,
      user_email,
      platform_fee_id,
      hire_request_id,
      purpose,
    } = req.body ?? {};

    const rupees = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(rupees) || rupees < 1 || rupees > 100000) {
      return jsonRes(res, { error: 'Enter an amount between ₹1 and ₹1,00,000' }, 400);
    }

    const buyerName = typeof user_name === 'string' ? user_name.trim() : '';
    const buyerId = typeof user_id === 'string' ? user_id.trim() : '';
    if (!buyerName && !buyerId) {
      return jsonRes(res, { error: 'Missing user' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const isHire = purpose === 'hire' || Boolean(hire_request_id);

    if (isHire) {
      if (!hire_request_id || !buyerId) {
        return jsonRes(res, { error: 'Invalid hire request' }, 400);
      }
      const { data: hireRequest, error: hrError } = await supabase
        .from('hire_requests')
        .select('*')
        .eq('id', hire_request_id)
        .eq('landowner_id', buyerId)
        .eq('status', 'completed')
        .single();

      if (hrError || !hireRequest) {
        return jsonRes(res, { error: 'Invalid hire request' }, 400);
      }
    }

    const orderId = merchantOrderId(buyerId, buyerName);
    const phone = digitsPhone(user_phone) || '9999999999';
    const notifyUrl = process.env.CASHFREE_NOTIFY_URL || '';
    const returnUrl = process.env.CASHFREE_RETURN_URL
      || 'https://www.cashfree.com/devstudio/thankyou?order_id={order_id}';

    const orderResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(appId, secretKey),
      body: JSON.stringify({
        order_id: orderId,
        order_amount: rupees,
        order_currency: 'INR',
        order_note: isHire ? 'Hire payment' : 'Platform fee payment',
        customer_details: {
          customer_id: customerId(buyerId, buyerName),
          customer_name: buyerName || 'User',
          customer_phone: phone,
          customer_email: typeof user_email === 'string' && user_email.includes('@')
            ? user_email
            : undefined,
        },
        order_meta: {
          return_url: returnUrl,
          ...(notifyUrl ? { notify_url: notifyUrl } : {}),
        },
        order_tags: {
          purpose: isHire ? 'hire' : 'wallet',
          user_id: buyerId,
          user_name: buyerName.slice(0, 255),
          platform_fee_id: String(platform_fee_id ?? ''),
          hire_request_id: String(hire_request_id ?? ''),
        },
      }),
    });

    const order = await orderResponse.json();
    if (!orderResponse.ok || !order.payment_session_id) {
      const cashfreeMessage = typeof order?.message === 'string' ? order.message : '';
      const cashfreeType = typeof order?.type === 'string' ? order.type : '';
      const hint = cashfreeType === 'authentication_error' || /authentication/i.test(cashfreeMessage)
        ? ' Check CASHFREE_APP_ID / CASHFREE_SECRET_KEY match CASHFREE_ENV (sandbox keys for sandbox, prod keys for production).'
        : '';
      return jsonRes(res, {
        error: `Failed to create order${cashfreeMessage ? `: ${cashfreeMessage}` : ''}${hint}`,
        details: order,
        environment: env,
      }, 502);
    }

    const stamp = new Date().toISOString();
    const cfOrderId = String(order.order_id || orderId);

    if (isHire) {
      const { data: hireRequest } = await supabase
        .from('hire_requests')
        .select('laborer_id')
        .eq('id', hire_request_id)
        .single();

      await supabase.from('payments').insert({
        hire_request_id,
        payer_id: buyerId,
        payee_id: hireRequest?.laborer_id,
        amount: rupees,
        platform_fee: 0,
        net_amount: rupees,
        payment_method: 'cashfree',
        payment_status: 'pending',
        cashfree_order_id: cfOrderId,
        razorpay_order_id: cfOrderId,
      });
    } else {
      const { error: insertError } = await supabase.from('payment_details').insert({
        id: uuid(),
        order_id: cfOrderId,
        product_id: 'wallet',
        buyer_name: buyerName || 'User',
        seller_name: '',
        amount: rupees,
        status: 'pending',
        payment_method: 'cashfree',
        transaction_id: cfOrderId,
        payment_type: 'fee_payment',
        platform_fee_id: platform_fee_id ?? null,
        verified_by_admin: false,
        buyer_id: buyerId || null,
        created_at: stamp,
        updated_at: stamp,
      });
      if (insertError) {
        return jsonRes(res, { error: 'Failed to record payment', details: insertError.message }, 500);
      }
    }

    return jsonRes(res, {
      payment_session_id: order.payment_session_id,
      order_id: cfOrderId,
      amount: rupees,
      currency: order.order_currency ?? 'INR',
      environment: env,
      test_mode: testMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonRes(res, { error: message }, 500);
  }
}

app.post('/api/create-cashfree-order', createCashfreeOrder);
app.post('/api/create-razorpay-order', createCashfreeOrder);

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { appId, secretKey, baseUrl } = cashfreeConfig();
    if (!appId || !secretKey) {
      return jsonRes(res, { error: 'Cashfree is not configured on the server' }, 500);
    }

    const webhookSignature = req.headers['x-webhook-signature'] ?? '';
    const webhookTimestamp = req.headers['x-webhook-timestamp'] ?? '';
    const isWebhook = Boolean(webhookSignature && webhookTimestamp);

    if (isWebhook) {
      if (!verifyWebhookSignature(webhookTimestamp, req.rawBody ?? JSON.stringify(req.body ?? {}), webhookSignature, secretKey)) {
        return jsonRes(res, { error: 'Invalid webhook signature' }, 400);
      }
    } else if (!req.headers.authorization) {
      return jsonRes(res, { error: 'Unauthorized' }, 401);
    }

    const payload = req.body ?? {};
    const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    const orderObj = data.order && typeof data.order === 'object' ? data.order : data;
    const paymentObj = data.payment && typeof data.payment === 'object' ? data.payment : data;

    const orderId = String(
      payload.order_id
        ?? payload.cashfree_order_id
        ?? payload.razorpay_order_id
        ?? orderObj.order_id
        ?? '',
    ).trim();
    const hireRequestId = typeof payload.hire_request_id === 'string' ? payload.hire_request_id : null;
    const userId = typeof payload.user_id === 'string' ? payload.user_id : null;

    if (!orderId) {
      return jsonRes(res, { error: 'Missing order id' }, 400);
    }

    let paid = await fetchPaidPayment(orderId, appId, secretKey, baseUrl);
    if (!paid && isWebhook && String(paymentObj.payment_status ?? '').toUpperCase() === 'SUCCESS') {
      paid = {
        orderId,
        paymentId: String(paymentObj.cf_payment_id ?? orderId),
        amount: Number(paymentObj.payment_amount ?? 0),
      };
    }
    if (!paid) {
      return jsonRes(res, { error: 'Payment is not successful yet' }, 409);
    }
    if (paymentObj.cf_payment_id) {
      paid.paymentId = String(paymentObj.cf_payment_id);
    }

    const supabase = getSupabaseAdmin();
    const result = await creditVerifiedPayment(supabase, paid, isWebhook ? null : userId, hireRequestId);
    return jsonRes(res, result);
  } catch (error) {
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonRes(res, { error: message }, status);
  }
});

app.post('/api/search-expand', async (req, res) => {
  try {
    const { query, language: _language } = req.body ?? {};

    if (!query || String(query).trim().length < 2) {
      return jsonRes(res, { expanded_terms: [String(query ?? '').toLowerCase()] });
    }

    if (!GROQ_API_KEY) {
      return jsonRes(res, { expanded_terms: [String(query).toLowerCase()] });
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SEARCH_EXPAND_PROMPT },
          { role: 'user', content: `Query: "${query}"` },
        ],
        max_tokens: 256,
        temperature: 0.1,
      }),
    });

    const result = await groqResponse.json();
    const raw = result.choices?.[0]?.message?.content || '[]';

    let cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    if (!cleaned.startsWith('[')) {
      cleaned = `["${query}"]`;
    }
    const terms = JSON.parse(cleaned);

    return jsonRes(res, { expanded_terms: terms });
  } catch (error) {
    console.error('Search expand error:', error);
    return jsonRes(res, { expanded_terms: [] });
  }
});

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  console.log(`Raitu Mitra server listening on port ${PORT}`);
});
