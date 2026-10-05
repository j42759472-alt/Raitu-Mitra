import { supabase } from './supabase';
import { isSameIstDay, isSameIstMonth } from './istDateTime';

export interface AppNotificationRow {
  id: string;
  recipient_user: string;
  type: string;
  title: string;
  body: string;
  reference_id: string;
  other_user: string;
  product_title: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface PlatformFeeRow {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  seller_name: string;
  buyer_name: string;
  sale_amount: number;
  quantity: number;
  fee_rate: number;
  fee_amount: number;
  fee_status: string;
  created_at: string | null;
  seller_id?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}

export interface PaymentDetailRow {
  id: string;
  order_id: string;
  product_id: string;
  buyer_name: string;
  seller_name: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  payment_type?: string;
  verified_by_admin?: boolean;
  created_at: string | null;
  buyer_id?: string | null;
  seller_id?: string | null;
}

export interface PaymentHistoryItem {
  id: string;
  type: 'fee' | 'payment';
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  createdAt: string | null;
}

export async function listNotificationsForUser(userName: string): Promise<AppNotificationRow[]> {
  const trimmed = userName.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_user', trimmed)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AppNotificationRow[];
}

export async function dismissNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_dismissed: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function getUnreadNotificationCount(userName: string): Promise<number> {
  const trimmed = userName.trim();
  if (!trimmed) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_user', trimmed)
    .eq('is_dismissed', false)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function markAllNotificationsRead(userName: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_user', userName.trim())
    .eq('is_read', false);

  if (error) throw error;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function listPaymentHistory(userName: string): Promise<{
  fees: PlatformFeeRow[];
  payments: PaymentDetailRow[];
  items: PaymentHistoryItem[];
}> {
  const trimmed = userName.trim();
  if (!trimmed) {
    return { fees: [], payments: [], items: [] };
  }

  const { data: feeRows, error: feeError } = await supabase
    .from('platform_fees')
    .select('*')
    .eq('seller_name', trimmed)
    .order('created_at', { ascending: false });

  if (feeError) throw feeError;

  const { data: sellerPayments, error: sellerPaymentError } = await supabase
    .from('payment_details')
    .select('*')
    .eq('seller_name', trimmed)
    .order('created_at', { ascending: false });

  if (sellerPaymentError) throw sellerPaymentError;

  const { data: buyerPayments, error: buyerPaymentError } = await supabase
    .from('payment_details')
    .select('*')
    .eq('buyer_name', trimmed)
    .order('created_at', { ascending: false });

  if (buyerPaymentError) throw buyerPaymentError;

  const fees = (feeRows ?? []) as PlatformFeeRow[];
  const payments = [...(sellerPayments ?? []), ...(buyerPayments ?? [])]
    .map((row) => row as PaymentDetailRow)
    .filter((row, index, all) => all.findIndex((candidate) => candidate.id === row.id) === index)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  const feePayments = payments.filter((payment) => payment.payment_type === 'fee_payment');

  const items: PaymentHistoryItem[] = [
    ...fees.map((fee) => ({
      id: fee.id,
      type: 'fee' as const,
      title: fee.product_title,
      subtitle: `Sale to ${fee.buyer_name} · Qty: ${fee.quantity}`,
      amount: fee.fee_amount,
      status: fee.fee_status,
      createdAt: fee.created_at,
    })),
    ...feePayments.map((payment) => ({
      id: payment.id,
      type: 'payment' as const,
      title: payment.payment_method ?? 'Payment',
      subtitle: payment.transaction_id || 'Platform fee payment',
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.created_at,
    })),
  ].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return { fees, payments, items };
}

export interface EarningsSummary {
  today: number;
  month: number;
  pending: number;
}

function isSameDay(iso: string | null, now: Date): boolean {
  return isSameIstDay(iso, now);
}

function isSameMonth(iso: string | null, now: Date): boolean {
  return isSameIstMonth(iso, now);
}

function isPendingStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'pending' || s === 'unpaid' || s === 'due' || s === 'processing';
}

function isCompletedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'paid' || s === 'completed' || s === 'success' || s === 'verified';
}

/** Android Settings-style Today / This Month / Pending earnings. */
export async function getEarningsSummary(userName: string): Promise<EarningsSummary> {
  const { fees, payments } = await listPaymentHistory(userName);
  const now = new Date();

  let today = 0;
  let month = 0;
  let pending = 0;

  // Seller-side payment receipts count as earnings
  payments
    .filter((p) => p.seller_name === userName.trim())
    .forEach((payment) => {
      if (isPendingStatus(payment.status)) {
        pending += payment.amount;
        return;
      }
      if (!isCompletedStatus(payment.status)) return;
      if (isSameDay(payment.created_at, now)) today += payment.amount;
      if (isSameMonth(payment.created_at, now)) month += payment.amount;
    });

  fees.forEach((fee) => {
    if (isPendingStatus(fee.fee_status)) {
      pending += fee.fee_amount;
    }
  });

  return { today, month, pending };
}
