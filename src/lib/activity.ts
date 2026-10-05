import { supabase } from './supabase';
import { nowIsoIst } from './istDateTime';
import { subtractBaseStock, toBase, isConvertible, normalizeUnit } from './units';

export interface AppOrder {
  id: string;
  product_id: string;
  product_title: string;
  buyer_name: string;
  seller_name: string;
  quantity: number;
  price: number;
  total_price: number;
  status: string;
  buyer_location: string | null;
  created_at: string | null;
}

export interface CreateOrderParams {
  productId: string;
  productTitle: string;
  buyerName: string;
  sellerName: string;
  quantity: number;
  buyerUnit?: string | null;
  price: number;
  totalPrice: number;
  status: string;
  buyerLocation: string;
  buyerId?: string | null;
  sellerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function nowIso(): string {
  return nowIsoIst();
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Categories that require seller confirmation before the order is confirmed (Android parity). */
export function orderStatusForCategory(category: string | null | undefined): 'PENDING' | 'CONFIRMED' {
  const cat = category ?? '';
  const pendingHints = ['Cars', 'Seater', 'Passengers', 'Bikes', 'Auto Rickshaw', 'Autorickshaw'];
  if (pendingHints.some((hint) => cat.toLowerCase().includes(hint.toLowerCase()))) {
    return 'PENDING';
  }
  return 'CONFIRMED';
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

/**
 * Android reserveOrderQuantity — deduct available stock when an order is placed
 * (skip for PENDING transport and for workforce date-based bookings).
 */
async function reserveOrderQuantity(params: {
  productId: string;
  quantity: number;
  buyerUnit?: string | null;
  status: string;
  startDate?: string | null;
  sellerName: string;
}): Promise<void> {
  const { data: product, error } = await supabase
    .from('products')
    .select('id, title, category, description, available_quantity, pending_quantity, listing_unit, unit')
    .eq('id', params.productId)
    .maybeSingle();
  if (error || !product) return;

  const category = String(product.category ?? '');
  const description = String(product.description ?? '');
  const isTransport = category.toLowerCase().includes('transport');

  if (isTransport && params.status === 'PENDING') return;
  if (category.startsWith('Workers') && params.startDate) return;

  const poolingOption = /Pooling Option:\s*(Pooling|Solo)/i.exec(description)?.[1] ?? 'Solo';
  const isTruckOrBike =
    category.toLowerCase().includes('trucks') || category.toLowerCase().includes('bikes');

  const available = Number(product.available_quantity ?? 0) || 0;
  const pending = Number(product.pending_quantity ?? 0) || 0;
  const listingUnit = product.listing_unit ?? product.unit ?? '';
  const buyerUnit = params.buyerUnit ?? listingUnit;

  let qtyToDeduct = params.quantity;
  if (isConvertible(listingUnit) && isConvertible(buyerUnit)
    && normalizeUnit(listingUnit) !== normalizeUnit(buyerUnit)
    && product.listing_unit) {
    qtyToDeduct = toBase(params.quantity, buyerUnit);
  }

  if (isTransport && (poolingOption === 'Solo' || isTruckOrBike)) {
    qtyToDeduct = available;
  }

  const newPending = pending + qtyToDeduct;
  const newAvail = subtractBaseStock(available, qtyToDeduct);

  await supabase
    .from('products')
    .update({
      pending_quantity: newPending,
      available_quantity: newAvail,
    })
    .eq('id', params.productId);

  if (available > 0 && newAvail <= 0) {
    await createOrderNotification({
      recipient: params.sellerName,
      title: 'Product Out of Stock',
      body: String(product.title ?? ''),
      referenceId: params.productId,
      otherUser: params.sellerName,
      productTitle: String(product.title ?? ''),
    });
  }
}

export async function createOrder(params: CreateOrderParams): Promise<AppOrder> {
  const id = uuid();
  const createdAt = nowIso();
  const pin = randomPin();

  const payload = {
    id,
    product_id: params.productId,
    product_title: params.productTitle,
    buyer_name: params.buyerName.trim(),
    seller_name: params.sellerName.trim(),
    quantity: params.quantity,
    buyer_unit: params.buyerUnit ?? null,
    price: params.price,
    total_price: params.totalPrice,
    status: params.status,
    buyer_location: params.buyerLocation,
    buyer_id: params.buyerId ?? null,
    seller_id: params.sellerId ?? null,
    created_at: createdAt,
    updated_at: createdAt,
    pin,
    start_date: params.startDate ?? null,
    end_date: params.endDate ?? null,
  };

  const { data, error } = await supabase.from('orders').insert(payload).select('*').single();
  if (error) throw error;

  try {
    await reserveOrderQuantity({
      productId: params.productId,
      quantity: params.quantity,
      buyerUnit: params.buyerUnit,
      status: params.status,
      startDate: params.startDate,
      sellerName: params.sellerName.trim(),
    });
  } catch {
    // Fail soft — order already created
  }

  try {
    await supabase.from('payment_details').insert({
      id: uuid(),
      order_id: id,
      product_id: params.productId,
      buyer_name: params.buyerName.trim(),
      seller_name: params.sellerName.trim(),
      amount: params.totalPrice,
      status: 'pending',
      payment_method: 'UPI',
      payment_type: 'order',
      buyer_id: params.buyerId ?? null,
      seller_id: params.sellerId ?? null,
      created_at: createdAt,
      updated_at: createdAt,
    });
  } catch {
    // Fail soft
  }

  await createOrderNotification({
    recipient: params.sellerName.trim(),
    title: 'New Sale Request',
    body: `${params.buyerName.trim()} • ${params.productTitle}`,
    referenceId: id,
    otherUser: params.buyerName.trim(),
    productTitle: params.productTitle,
  });
  await createOrderNotification({
    recipient: params.buyerName.trim(),
    title: 'Order Pending',
    body: params.productTitle,
    referenceId: id,
    otherUser: params.sellerName.trim(),
    productTitle: params.productTitle,
  });

  return data as AppOrder;
}

export async function listOrdersForUser(userName: string): Promise<AppOrder[]> {
  const trimmed = userName.trim();
  if (!trimmed) return [];

  const { data: asBuyer, error: buyerError } = await supabase
    .from('orders')
    .select('*')
    .eq('buyer_name', trimmed);

  if (buyerError) throw buyerError;

  const { data: asSeller, error: sellerError } = await supabase
    .from('orders')
    .select('*')
    .eq('seller_name', trimmed);

  if (sellerError) throw sellerError;

  return [...(asBuyer ?? []), ...(asSeller ?? [])]
    .map((row) => row as AppOrder)
    .filter((row, index, all) => all.findIndex((candidate) => candidate.id === row.id) === index)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}

export async function createJobListing(params: {
  title: string;
  description: string;
  requiredSkills: string[];
  startDate: string;
  wage: number;
  wageType: 'daily' | 'hourly' | 'fixed';
  includesFood: boolean;
  includesTransport: boolean;
  location: string;
  sellerName: string;
  sellerId?: string;
}): Promise<void> {
  const details = [
    params.description.trim(),
    params.requiredSkills.length ? `Skills: ${params.requiredSkills.join(', ')}` : '',
    params.startDate ? `Date: ${params.startDate}` : '',
    `Wage Type: ${params.wageType}`,
    `Food included: ${params.includesFood}`,
    `Transport included: ${params.includesTransport}`,
  ].filter(Boolean).join('\n');

  const payload = {
    title: params.title.trim(),
    description: details,
    price: params.wage,
    category: 'Jobs',
    unit: 'day',
    location: params.location.trim(),
    offering_type: 'Rent',
    seller_name: params.sellerName.trim(),
    seller_id: params.sellerId ?? null,
    available_quantity: 1,
  };

  const { error } = await supabase.from('products').insert(payload);
  if (error) throw error;
}
