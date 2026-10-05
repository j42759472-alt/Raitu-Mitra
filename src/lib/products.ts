import { supabase } from './supabase';
import { effectiveAvailableQuantity, getProductQuantityDisplay, type ProductQuantityDisplay } from './units';
import { isSellerRestricted, syncRestrictedSellers } from './wallet';

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  unit: string;
  location: string;
  offeringType: string;
  sellerName: string;
  sellerId?: string;
  imageUri?: string;
  additionalImageUris: string[];
  availableQuantity: number;
  minOrder: number;
  rating: number;
  reviews: number;
  createdAt: number;
  listingUnit?: string;
  withDriver?: string;
  genericType: 'product' | 'equipment' | 'worker';
  specificType: string;
  skills: string[];
  workerCount?: number;
  isGroup?: boolean;
  /** Android-parity display helpers for price/qty units. */
  qty: ProductQuantityDisplay;
}

interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number | string | null;
  category: string | null;
  unit: string | null;
  location: string | null;
  offering_type: string | null;
  seller_name: string | null;
  seller_id: string | null;
  image_uri: string | null;
  additional_image_uris: string | null;
  available_quantity: number | string | null;
  min_order: number | string | null;
  rating: number | string | null;
  reviews: number | string | null;
  created_at: number | string | null;
  listing_unit?: string | null;
  with_driver?: string | null;
}

export async function listMarketplaceProducts(options?: {
  /** When true (default), hide sellers with wallet balance < -₹2000 (Android parity). */
  hideRestrictedSellers?: boolean;
  /** When true (default), hide zero-stock non-worker listings. */
  hideOutOfStock?: boolean;
}): Promise<MarketplaceProduct[]> {
  const hideRestrictedSellers = options?.hideRestrictedSellers !== false;
  const hideOutOfStock = options?.hideOutOfStock !== false;

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      price,
      category,
      unit,
      location,
      offering_type,
      seller_name,
      seller_id,
      image_uri,
      additional_image_uris,
      available_quantity,
      min_order,
      rating,
      reviews,
      created_at,
      listing_unit,
      with_driver
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  let items = (data ?? []).map((row) => mapProductRow(row as ProductRow));

  if (hideOutOfStock) {
    items = items.filter((item) => {
      if (item.genericType === 'worker') return true;
      return item.availableQuantity > 0;
    });
  }

  items = items.filter((item) => !item.description.includes('||DISABLED||'));

  if (hideRestrictedSellers) {
    const restricted = await syncRestrictedSellers();
    if (restricted.size > 0) {
      items = items.filter(
        (item) => !isSellerRestricted(restricted, item.sellerName, item.sellerId),
      );
    }
  }

  return items;
}

export async function listEquipmentProducts(): Promise<MarketplaceProduct[]> {
  const items = await listMarketplaceProducts();
  return items.filter((item) => item.genericType === 'equipment');
}

export async function listWorkerRegistrations(): Promise<MarketplaceProduct[]> {
  const items = await listMarketplaceProducts();
  return items.filter((item) => item.genericType === 'worker');
}

export async function getMarketplaceProductById(id: string): Promise<MarketplaceProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      price,
      category,
      unit,
      location,
      offering_type,
      seller_name,
      seller_id,
      image_uri,
      additional_image_uris,
      available_quantity,
      min_order,
      rating,
      reviews,
      created_at,
      listing_unit,
      with_driver
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProductRow(data as ProductRow) : null;
}

export async function createWorkerRegistration(params: {
  title: string;
  category: string;
  subCategory?: string;
  skills: string[];
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  dailyPay: number;
  location: string;
  sellerName: string;
  sellerId?: string;
  isGroup: boolean;
  memberCount?: number;
}): Promise<void> {
  const normalizedCategory = params.category.trim() || 'General';
  const normalizedSubCategory = params.subCategory?.trim() || 'All';
  // Android Single/GroupRegistrationFragment description format
  const descriptionLines = [
    params.isGroup ? `Members: ${Math.max(2, params.memberCount ?? 2)}` : '',
    `Skills: ${params.skills.join('; ')}`,
    `Date: ${params.startDate}${params.startTime ? ` ${params.startTime}` : ''}`,
    `End: ${params.endDate || params.startDate}${params.endTime ? ` ${params.endTime}` : ''}`,
  ].filter(Boolean);

  const payload = {
    title: params.title.trim(),
    description: descriptionLines.join('\n'),
    price: params.dailyPay,
    category: `Workers|${normalizedCategory}|${normalizedSubCategory}`,
    unit: 'daily',
    location: params.location.trim(),
    offering_type: params.isGroup ? 'WorkGroup' : 'Work',
    seller_name: params.sellerName.trim(),
    seller_id: params.sellerId ?? null,
    available_quantity: params.isGroup ? Math.max(1, params.memberCount ?? 1) : 1,
  };

  const { error } = await supabase.from('products').insert(payload);
  if (error) throw error;
}

/** Create a Sell listing — category uses Android pipe format (e.g. Husbandry|Cattle|Cow). */
export async function createMarketplaceProduct(params: {
  title: string;
  description?: string;
  price: number;
  category: string;
  unit: string;
  location: string;
  sellerName: string;
  sellerId?: string;
  availableQuantity: number;
  minOrder?: number;
  offeringType?: string;
}): Promise<void> {
  const payload = {
    title: params.title.trim(),
    description: params.description?.trim() || null,
    price: params.price,
    category: params.category.trim(),
    unit: params.unit.trim() || 'per animal',
    location: params.location.trim(),
    offering_type: params.offeringType ?? 'Sell',
    seller_name: params.sellerName.trim(),
    seller_id: params.sellerId ?? null,
    available_quantity: params.availableQuantity,
    min_order: params.minOrder ?? 1,
  };

  const { error } = await supabase.from('products').insert(payload);
  if (error) throw error;
}

export async function listProductsBySeller(sellerName: string): Promise<MarketplaceProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      price,
      category,
      unit,
      location,
      offering_type,
      seller_name,
      seller_id,
      image_uri,
      additional_image_uris,
      available_quantity,
      min_order,
      rating,
      reviews,
      created_at,
      listing_unit,
      with_driver
    `)
    .eq('seller_name', sellerName.trim())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProductRow(row as ProductRow));
}

/** Transport pooling listings owned by seller — Android MainActivity.checkPoolingOutOfStock. */
export async function listPoolingRepostCandidates(sellerName: string): Promise<MarketplaceProduct[]> {
  const mine = await listProductsBySeller(sellerName);
  return mine.filter(
    (p) => /transport/i.test(p.category) && /Pooling Option:\s*Pooling/i.test(p.description),
  );
}

export async function disableProduct(productId: string): Promise<void> {
  const existing = await getMarketplaceProductById(productId);
  if (!existing || existing.description.includes('||DISABLED||')) return;
  const disabledDesc = `${existing.description}\n||DISABLED||`;
  const { error } = await supabase
    .from('products')
    .update({ description: disabledDesc })
    .eq('id', productId);
  if (error) throw error;
}

export async function enableProduct(productId: string): Promise<void> {
  const existing = await getMarketplaceProductById(productId);
  if (!existing || !existing.description.includes('||DISABLED||')) return;
  const cleanDesc = existing.description.replace(/\n?\|\|DISABLED\|\|/g, '').trim();
  const { error } = await supabase
    .from('products')
    .update({ description: cleanDesc })
    .eq('id', productId);
  if (error) throw error;
}

export async function updateMarketplaceProduct(
  id: string,
  patch: Partial<Pick<MarketplaceProduct, 'title' | 'description' | 'price' | 'unit' | 'location' | 'availableQuantity' | 'minOrder'>>,
): Promise<void> {
  const payload: Record<string, unknown> = {};

  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.unit !== undefined) payload.unit = patch.unit;
  if (patch.location !== undefined) payload.location = patch.location.trim();
  if (patch.availableQuantity !== undefined) payload.available_quantity = patch.availableQuantity;
  if (patch.minOrder !== undefined) payload.min_order = patch.minOrder;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id);

  if (error) throw error;
}

export function filterMarketplaceProducts(
  items: MarketplaceProduct[],
  query: string,
  selectedSkills: string[] = [],
  /** Extra synonym / AI expansion terms (Android SearchFragment.filterResults). */
  expandedTerms: string[] = [],
): MarketplaceProduct[] {
  const normalizedQuery = query.trim().toLowerCase();
  const terms = Array.from(
    new Set(
      [normalizedQuery, ...expandedTerms.map((t) => t.trim().toLowerCase())]
        .filter((t) => t.length >= 1),
    ),
  );

  return items.filter((item) => {
    const searchable = [
      item.title,
      item.description,
      item.category,
      item.location,
      item.sellerName,
      item.specificType,
      item.skills.join(' '),
    ].join(' ').toLowerCase();

    const matchesQuery = terms.length === 0
      || terms.some((term) => searchable.includes(term));
    const matchesSkills = selectedSkills.length === 0
      || selectedSkills.some((skill) => item.skills.includes(skill));

    return matchesQuery && matchesSkills;
  });
}

function mapProductRow(row: ProductRow): MarketplaceProduct {
  const description = row.description ?? '';
  const category = row.category ?? '';
  const offeringType = row.offering_type ?? '';
  const genericType = getGenericType(category, offeringType);
  const specificType = getSpecificType(category);
  const additionalImageUris = (row.additional_image_uris ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const fallbackWorkerCount = Number(row.available_quantity ?? 0) || 2;
  const workerCount = offeringType === 'WorkGroup'
    ? (extractNumberField(description, 'Members') ?? fallbackWorkerCount)
    : 1;

  const price = Number(row.price ?? 0) || 0;
  const unit = row.unit ?? '';
  const availableQuantity = effectiveAvailableQuantity(
    category,
    description,
    Number(row.available_quantity ?? 0) || 0,
  );
  const minOrder = Number(row.min_order ?? 1) || 1;
  const listingUnit = row.listing_unit ?? undefined;

  const qty = genericType === 'worker'
    ? {
        quantityUnit: normalizeWorkerUnit(unit),
        priceUnit: normalizeWorkerUnit(unit),
        priceUnitLabel: normalizeWorkerUnit(unit) ? `/ ${normalizeWorkerUnit(unit)}` : '/ day',
        pricePerLabel: normalizeWorkerUnit(unit) ? `per ${normalizeWorkerUnit(unit)}` : 'per day',
        quantityPrice: 0,
        quantityPriceUnit: '',
        displayAvailable: availableQuantity,
        displayMinOrder: 1,
        availableText: availableQuantity ? String(availableQuantity) : 'Not specified',
        minOrderText: '1',
        priceText: `₹${price.toLocaleString()}${normalizeWorkerUnit(unit) ? ` / ${normalizeWorkerUnit(unit)}` : ' / day'}`,
      }
    : getProductQuantityDisplay({
        description,
        unit,
        listingUnit,
        price,
        availableQuantity,
        minOrder,
      });

  return {
    id: row.id,
    title: row.title,
    description,
    price,
    category,
    unit,
    location: row.location ?? '',
    offeringType,
    sellerName: row.seller_name ?? 'Unknown',
    sellerId: row.seller_id ?? undefined,
    imageUri: row.image_uri ?? undefined,
    additionalImageUris,
    availableQuantity,
    minOrder,
    rating: Number(row.rating ?? 0) || 0,
    reviews: Number(row.reviews ?? 0) || 0,
    createdAt: Number(row.created_at ?? 0) || 0,
    listingUnit,
    withDriver: row.with_driver ?? undefined,
    genericType,
    specificType,
    skills: extractSkills(description),
    workerCount,
    isGroup: offeringType === 'WorkGroup',
    qty,
  };
}

function normalizeWorkerUnit(unit: string): string {
  const bare = unit.replace(/^per\s+/i, '').replace(/^\//, '').trim().toLowerCase();
  if (!bare || bare === 'daily') return 'day';
  return bare;
}

function extractSkills(description: string): string[] {
  const raw = extractTextField(description, 'Skills');
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractTextField(description: string, label: string): string | undefined {
  const regex = new RegExp(`^${escapeRegex(label)}:\\s*(.+)$`, 'im');
  return regex.exec(description)?.[1]?.trim();
}

function extractNumberField(description: string, label: string): number | undefined {
  const value = extractTextField(description, label);
  if (!value) return undefined;
  const parsed = Number(value.split(' ')[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getGenericType(category: string, offeringType: string): MarketplaceProduct['genericType'] {
  if (category.startsWith('Workers|')) return 'worker';
  // Android home farm equipment posts as offeringType "Sell" but ProductDetails treats
  // Drones/Tractor/… as rental. Keep "equipment" for those + explicit Rent listings.
  if (offeringType.toLowerCase() === 'rent') return 'equipment';
  if (
    /^Drones/i.test(category)
    || /^Tractor/i.test(category)
    || /^Thresher/i.test(category)
    || /^Harvester/i.test(category)
    || /^Cultivator/i.test(category)
    || /^Borewells/i.test(category)
    || /^StonePicker/i.test(category)
    || /^HeavyEquipment_Others/i.test(category)
    || /^Manual/i.test(category)
  ) {
    return 'equipment';
  }
  return 'product';
}

function getSpecificType(category: string): string {
  const parts = category.split('|').filter(Boolean);
  return parts[parts.length - 1] ?? 'General';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
