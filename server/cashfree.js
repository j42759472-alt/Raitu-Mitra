import crypto from 'node:crypto';

export const CASHFREE_API_VERSION = '2023-08-01';

export function cashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID ?? '';
  const secretKey = process.env.CASHFREE_SECRET_KEY ?? '';
  const env = resolveCashfreeEnv(appId, process.env.CASHFREE_ENV);
  const baseUrl = env === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
  return { appId, secretKey, env, baseUrl, testMode: env !== 'production' };
}

export function resolveCashfreeEnv(appId, explicit) {
  const value = String(explicit ?? '').trim().toLowerCase();
  if (value === 'production' || value === 'prod' || value === 'live') return 'production';
  if (value === 'sandbox' || value === 'test') return 'sandbox';
  if (String(appId).toUpperCase().startsWith('TEST')) return 'sandbox';
  return 'sandbox';
}

export function cashfreeHeaders(appId, secretKey) {
  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': CASHFREE_API_VERSION,
  };
}

export function digitsPhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

export function customerId(userId, userName) {
  const fromId = String(userId ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  if (fromId) return fromId;
  const fromName = `u_${String(userName ?? 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}`;
  return fromName || `u_${Date.now()}`;
}

export function merchantOrderId(userId, userName) {
  const seed = String(userId || userName || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  return `wlt_${seed}_${Date.now()}`.slice(0, 50);
}

export function verifyWebhookSignature(timestamp, rawBody, signature, secretKey) {
  const expected = crypto.createHmac('sha256', secretKey).update(timestamp + rawBody).digest('base64');
  return expected === signature;
}

export async function fetchPaidPayment(orderId, appId, secretKey, baseUrl) {
  const headers = cashfreeHeaders(appId, secretKey);
  const orderRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, { headers });
  const order = await orderRes.json().catch(() => ({}));
  if (!orderRes.ok) return null;

  const paymentsRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, { headers });
  const payments = await paymentsRes.json().catch(() => []);
  const list = Array.isArray(payments) ? payments : [];
  const success = list.find((row) => row.payment_status === 'SUCCESS');

  const orderPaid = String(order.order_status ?? '').toUpperCase() === 'PAID';
  if (!orderPaid && !success) return null;

  return {
    orderId,
    paymentId: String(success?.cf_payment_id ?? success?.payment_id ?? order.cf_order_id ?? orderId),
    amount: Number(success?.payment_amount ?? order.order_amount ?? 0),
  };
}

export async function creditVerifiedPayment(supabase, paid, userId, hireRequestId) {
  const stamp = new Date().toISOString();

  const { data: walletRows, error: walletLookupError } = await supabase
    .from('payment_details')
    .select('id, status, platform_fee_id, buyer_id')
    .eq('order_id', paid.orderId)
    .eq('payment_type', 'fee_payment')
    .limit(1);

  if (walletLookupError) {
    throw Object.assign(new Error(walletLookupError.message), { status: 500 });
  }

  const walletRow = walletRows?.[0];
  if (walletRow) {
    if (userId && walletRow.buyer_id && walletRow.buyer_id !== userId) {
      throw Object.assign(new Error('Payment does not belong to this user'), { status: 403 });
    }

    if (walletRow.status !== 'completed') {
      const { error: updateError } = await supabase
        .from('payment_details')
        .update({
          status: 'completed',
          payment_method: 'cashfree',
          transaction_id: paid.paymentId,
          verified_by_admin: true,
          updated_at: stamp,
        })
        .eq('id', walletRow.id);

      if (updateError) throw updateError;

      if (walletRow.platform_fee_id) {
        await supabase
          .from('platform_fees')
          .update({
            fee_status: 'paid',
            payment_reference: paid.paymentId,
          })
          .eq('id', walletRow.platform_fee_id);
      }
    }

    return { success: true, type: 'wallet' };
  }

  const { data: hireRows, error: hireLookupError } = await supabase
    .from('payments')
    .select('id, hire_request_id')
    .eq('razorpay_order_id', paid.orderId)
    .limit(1);

  if (hireLookupError) {
    throw Object.assign(new Error(hireLookupError.message), { status: 500 });
  }

  const hireRow = hireRows?.[0];
  if (!hireRow) {
    throw Object.assign(new Error('Payment order not found'), { status: 404 });
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      cashfree_order_id: paid.orderId,
      cashfree_payment_id: paid.paymentId,
      razorpay_order_id: paid.orderId,
      razorpay_payment_id: paid.paymentId,
      payment_method: 'cashfree',
      payment_status: 'completed',
      paid_at: stamp,
    })
    .eq('id', hireRow.id);

  if (paymentError) throw paymentError;

  const resolvedHireId = hireRequestId || hireRow.hire_request_id;
  if (resolvedHireId) {
    const { data: hireRequest } = await supabase
      .from('hire_requests')
      .update({ status: 'paid', updated_at: stamp })
      .eq('id', resolvedHireId)
      .select('laborer_id, landowner_id, offered_wage')
      .single();

    if (hireRequest) {
      await supabase.rpc('increment_jobs_completed', {
        user_id: hireRequest.laborer_id,
      });

      const { data: landowner } = await supabase
        .from('profiles')
        .select('full_name, preferred_language')
        .eq('id', hireRequest.landowner_id)
        .single();

      await supabase.from('notifications').insert({
        user_id: hireRequest.laborer_id,
        type: 'payment_received',
        title: 'Payment Received',
        body: `Payment of ₹${hireRequest.offered_wage} received from ${landowner?.full_name}`,
        data: { hire_request_id: resolvedHireId, amount: hireRequest.offered_wage },
      });
    }
  }

  return { success: true, type: 'hire' };
}
