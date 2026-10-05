import { apiUrl } from './api';
import { supabase } from './supabase';

const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export type CashfreeWalletOrder = {
  paymentSessionId: string;
  orderId: string;
  amount: number;
  currency: string;
  environment: 'sandbox' | 'production';
  testMode: boolean;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: string }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<{
        error?: { message?: string; description?: string };
        paymentDetails?: unknown;
        redirect?: boolean;
      }>;
    };
  }
}

async function postApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token || SUPABASE_ANON;

  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof json.error === 'string' ? json.error : `Payment request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export async function createWalletOrder(params: {
  amount: number;
  userId?: string | null;
  userName: string;
  userPhone?: string | null;
  userEmail?: string | null;
  platformFeeId?: string | null;
}): Promise<CashfreeWalletOrder> {
  const json = await postApi<{
    payment_session_id: string;
    order_id: string;
    amount: number;
    currency?: string;
    environment?: string;
    test_mode?: boolean;
  }>('/create-cashfree-order', {
    amount: params.amount,
    user_id: params.userId ?? '',
    user_name: params.userName,
    user_phone: params.userPhone ?? '',
    user_email: params.userEmail ?? '',
    platform_fee_id: params.platformFeeId ?? null,
    purpose: 'wallet',
  });

  if (!json.payment_session_id || !json.order_id) {
    throw new Error('Cashfree did not return an order');
  }

  const environment = json.environment === 'production' ? 'production' : 'sandbox';
  return {
    paymentSessionId: json.payment_session_id,
    orderId: json.order_id,
    amount: Number(json.amount),
    currency: json.currency ?? 'INR',
    environment,
    testMode: Boolean(json.test_mode ?? environment !== 'production'),
  };
}

export async function verifyWalletPayment(
  orderId: string,
  userId?: string | null,
): Promise<void> {
  const json = await postApi<{ success?: boolean; error?: string }>('/verify-payment', {
    order_id: orderId,
    user_id: userId ?? '',
  });
  if (!json.success) {
    throw new Error(json.error || 'Could not verify payment');
  }
}

export function tenDigitPhone(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function loadCashfreeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree'));
    document.body.appendChild(script);
  });
}

export async function openCashfreeCheckout(params: {
  amount: number;
  userName: string;
  userId?: string | null;
  userPhone?: string;
  userEmail?: string;
  platformFeeId?: string | null;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const order = await createWalletOrder({
    amount: params.amount,
    userId: params.userId,
    userName: params.userName,
    userPhone: params.userPhone,
    userEmail: params.userEmail,
    platformFeeId: params.platformFeeId,
  });

  await loadCashfreeScript();

  const cashfree = window.Cashfree!({
    mode: order.environment === 'production' ? 'production' : 'sandbox',
  });
  const result = await cashfree.checkout({
    paymentSessionId: order.paymentSessionId,
    redirectTarget: '_modal',
  });

  if (result?.error) {
    const msg = result.error.message || result.error.description || 'Payment failed';
    params.onError?.(msg);
    throw new Error(msg);
  }
  if (!result?.paymentDetails) {
    params.onError?.('Payment cancelled');
    throw new Error('Payment cancelled');
  }

  try {
    await verifyWalletPayment(order.orderId, params.userId);
    params.onSuccess?.();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Payment verification failed';
    params.onError?.(msg);
    throw new Error(msg);
  }
}
