/**
 * Order lifecycle helpers — mirrors Android RaituRepository cancel / complete / revoke.
 */
import { supabase } from './supabase';
import { nowIsoIst } from './istDateTime';

const CANCEL_WINDOW_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const SALE_FEE_RATE = 0.025;
const CANCEL_FEE_RATE = 0.01;

export interface OrderLifecycleRow {
  id: string;
  product_id: string;
  product_title: string;
  buyer_name: string;
  seller_name: string;
  buyer_id?: string | null;
  seller_id?: string | null;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string | null;
  updated_at?: string | null;
  end_date?: string | null;
  pin?: string | null;
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return nowIsoIst();
}

export function isTerminalOrderStatus(status: string): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED';
}

export function parseIsoTimestamp(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

/** Parse YYYY-MM-DD as start-of-day local/UTC millis (Android IstDateTime.parseMillis). */
export function parseDateOnly(date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return null;
  const ms = Date.parse(`${m[1]}-${m[2]}-${m[3]}T00:00:00+05:30`);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * PIN / auto-fail deadline:
 * - With end_date: start of end_date + 2 days (inclusive day + 24h grace)
 * - Without end_date: created_at + 24 hours
 */
export function getOrderCompletionDeadlineMs(order: OrderLifecycleRow): number | null {
  const endDate = order.end_date?.trim() ?? '';
  if (endDate) {
    const startOfEndDay = parseDateOnly(endDate);
    if (startOfEndDay == null) return null;
    return startOfEndDay + 2 * DAY_MS;
  }
  const createdAt = parseIsoTimestamp(order.created_at);
  if (createdAt == null) return null;
  return createdAt + DAY_MS;
}

export function getOrderTerminalTimestampMs(order: OrderLifecycleRow): number | null {
  return parseIsoTimestamp(order.updated_at) ?? parseIsoTimestamp(order.created_at);
}

/** Completed Orders card TTL: visible for 1 week after terminal status. */
export function isWithinCompletedOrdersTtl(
  order: OrderLifecycleRow,
  nowMs: number = Date.now(),
): boolean {
  if (!isTerminalOrderStatus(order.status)) return false;
  const terminalMs = getOrderTerminalTimestampMs(order);
  if (terminalMs == null) return false;
  return nowMs - terminalMs < WEEK_MS;
}

export function withinCancelWindow(
  order: OrderLifecycleRow,
  nowMs: number = Date.now(),
): boolean {
  if (order.status !== 'ACCEPTED' && order.status !== 'CONFIRMED') return false;
  const createdAtMs = parseIsoTimestamp(order.created_at);
  if (createdAtMs == null) return false;
  return nowMs - createdAtMs <= CANCEL_WINDOW_MS;
}

async function findCancellationFeeForOrder(orderId: string): Promise<boolean> {
  const { data } = await supabase
    .from('platform_fees')
    .select('id')
    .eq('order_id', orderId)
    .eq('notes', 'cancellation_fee')
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function deleteSalePlatformFee(orderId: string): Promise<void> {
  // Sale fees have blank/null notes (Android: notes.isNullOrBlank())
  const { data } = await supabase
    .from('platform_fees')
    .select('id, notes')
    .eq('order_id', orderId);

  const saleFees = (data ?? []).filter((row: { notes?: string | null }) => !row.notes?.trim());
  for (const fee of saleFees) {
    await supabase.from('platform_fees').delete().eq('id', fee.id);
  }
}

async function ensureCancellationFee(params: {
  order: OrderLifecycleRow;
  chargedToName: string;
  counterpartyName: string;
  chargedToId?: string | null;
}): Promise<void> {
  if (await findCancellationFeeForOrder(params.order.id)) return;

  const cancelFeeAmount = params.order.total_price * CANCEL_FEE_RATE;
  const stamp = nowIso();
  await supabase.from('platform_fees').insert({
    id: uuid(),
    order_id: params.order.id,
    product_id: params.order.product_id,
    product_title: params.order.product_title,
    seller_name: params.chargedToName,
    buyer_name: params.counterpartyName,
    sale_amount: params.order.total_price,
    quantity: params.order.quantity,
    fee_rate: CANCEL_FEE_RATE,
    fee_amount: cancelFeeAmount,
    currency: 'INR',
    fee_status: 'unpaid',
    seller_id: params.chargedToId ?? null,
    notes: 'cancellation_fee',
    created_at: stamp,
    updated_at: stamp,
  });
}

export async function createPlatformFeeFromOrder(order: OrderLifecycleRow): Promise<void> {
  const { data: remoteFees } = await supabase
    .from('platform_fees')
    .select('*')
    .eq('order_id', order.id);

  const existingSale = (remoteFees ?? []).find(
    (row: { notes?: string | null }) => !row.notes?.trim(),
  );
  if (existingSale) return;

  const stamp = nowIso();
  const feeAmount = order.total_price * SALE_FEE_RATE;
  await supabase.from('platform_fees').insert({
    id: uuid(),
    order_id: order.id,
    product_id: order.product_id,
    product_title: order.product_title,
    seller_name: order.seller_name,
    buyer_name: order.buyer_name,
    sale_amount: order.total_price,
    quantity: order.quantity,
    fee_rate: SALE_FEE_RATE,
    fee_amount: feeAmount,
    currency: 'INR',
    fee_status: 'unpaid',
    seller_id: order.seller_id ?? null,
    created_at: stamp,
    updated_at: stamp,
  });
}

async function createOrderNotification(params: {
  recipient: string;
  title: string;
  body: string;
  referenceId: string;
  otherUser: string;
  productTitle: string;
}): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      id: uuid(),
      recipient_user: params.recipient,
      type: 'ORDER',
      title: params.title,
      body: params.body,
      reference_id: params.referenceId,
      other_user: params.otherUser,
      product_title: params.productTitle,
      is_read: false,
      is_dismissed: false,
      created_at: nowIso(),
    });
  } catch {
    // Fail soft
  }
}

export async function completeOrder(order: OrderLifecycleRow): Promise<void> {
  if (order.status === 'COMPLETED') return;

  await createPlatformFeeFromOrder(order);

  const finishedAt = nowIso();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'COMPLETED', updated_at: finishedAt })
    .eq('id', order.id);
  if (error) throw error;

  await createOrderNotification({
    recipient: order.buyer_name,
    title: 'Job Completed',
    body: order.product_title,
    referenceId: order.id,
    otherUser: order.seller_name,
    productTitle: order.product_title,
  });
}

/**
 * Cancel / revoke an order.
 * - 30-minute window (except buyer cancelling PENDING)
 * - Refunds 2.5% sale fee
 * - Charges 1% cancellation fee (except buyer cancelling PENDING)
 */
export async function cancelOrder(
  order: OrderLifecycleRow,
  cancelledBy: string,
): Promise<void> {
  if (isTerminalOrderStatus(order.status)) return;

  const isBuyerCancellingPending =
    cancelledBy === order.buyer_name && order.status === 'PENDING';

  if (!isBuyerCancellingPending) {
    const createdAt = parseIsoTimestamp(order.created_at);
    if (createdAt != null && Date.now() - createdAt > CANCEL_WINDOW_MS) {
      throw new Error('Cancellation period of 30 minutes has expired');
    }
  }

  const finishedAt = nowIso();
  const { error } = await supabase
    .from('orders')
    .update({ status: 'CANCELLED', updated_at: finishedAt })
    .eq('id', order.id);
  if (error) throw error;

  await deleteSalePlatformFee(order.id);

  const isBuyerCancelling = cancelledBy === order.buyer_name;
  const wasPending = order.status === 'PENDING';
  if (!(isBuyerCancelling && wasPending)) {
    await ensureCancellationFee({
      order,
      chargedToName: cancelledBy,
      counterpartyName:
        cancelledBy === order.buyer_name ? order.seller_name : order.buyer_name,
      chargedToId:
        cancelledBy === order.seller_name ? order.seller_id : order.buyer_id,
    });
  }

  const isSellerCancelling = cancelledBy === order.seller_name;
  await createOrderNotification({
    recipient: cancelledBy,
    title: isSellerCancelling ? 'Sale Revoked' : 'Order Cancelled',
    body: order.product_title,
    referenceId: order.id,
    otherUser: isBuyerCancelling ? order.seller_name : order.buyer_name,
    productTitle: order.product_title,
  });
  await createOrderNotification({
    recipient: isBuyerCancelling ? order.seller_name : order.buyer_name,
    title: isSellerCancelling ? 'Order Revoked' : 'Sale Cancelled',
    body: `${cancelledBy} • ${order.product_title}`,
    referenceId: order.id,
    otherUser: cancelledBy,
    productTitle: order.product_title,
  });
}

async function revokeExpiredOrder(order: OrderLifecycleRow): Promise<void> {
  if (isTerminalOrderStatus(order.status)) return;

  if (await findCancellationFeeForOrder(order.id)) {
    await supabase
      .from('orders')
      .update({ status: 'CANCELLED', updated_at: nowIso() })
      .eq('id', order.id);
    return;
  }

  await supabase
    .from('orders')
    .update({ status: 'CANCELLED', updated_at: nowIso() })
    .eq('id', order.id);

  await deleteSalePlatformFee(order.id);

  await ensureCancellationFee({
    order,
    chargedToName: order.buyer_name,
    counterpartyName: order.seller_name,
    chargedToId: order.buyer_id,
  });
}

/** Revoke ACCEPTED/CONFIRMED orders past their PIN deadline (Android checkAndRevokeExpiredOrders). */
export async function checkAndRevokeExpiredOrders(
  orders: OrderLifecycleRow[],
): Promise<number> {
  const now = Date.now();
  let revoked = 0;
  for (const order of orders) {
    if (order.status !== 'ACCEPTED' && order.status !== 'CONFIRMED') continue;
    const deadline = getOrderCompletionDeadlineMs(order);
    if (deadline == null || now < deadline) continue;
    try {
      await revokeExpiredOrder(order);
      revoked += 1;
    } catch {
      // Continue other orders
    }
  }
  return revoked;
}
