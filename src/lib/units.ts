/** Mirrors Android UnitConverter + ProductQuantityHelper for display/stock math. */

const WEIGHT_TO_GRAMS: Record<string, number> = {
  ton: 1_000_000,
  tonne: 1_000_000,
  quintal: 100_000,
  kg: 1_000,
  kilogram: 1_000,
  kilograms: 1_000,
  grams: 1,
  gram: 1,
  g: 1,
};

const VOLUME_TO_ML: Record<string, number> = {
  liter: 1_000,
  litre: 1_000,
  liters: 1_000,
  litres: 1_000,
  l: 1_000,
  ml: 1,
  milliliter: 1,
  millilitre: 1,
};

const WEIGHT_DISPLAY_ORDER = ['ton', 'quintal', 'kg', 'grams'] as const;
const VOLUME_DISPLAY_ORDER = ['liter', 'ml'] as const;

type UnitFamily = 'weight' | 'volume' | 'count';

export function normalizeUnit(raw: string | null | undefined): string {
  if (!raw) return '';
  let u = raw.trim().toLowerCase();
  if (u.startsWith('per ')) u = u.slice(4).trim();
  if (u.startsWith('/')) u = u.slice(1).trim();
  return u;
}

function factor(unit: string): number | null {
  const key = normalizeUnit(unit);
  if (!key) return null;
  return WEIGHT_TO_GRAMS[key] ?? VOLUME_TO_ML[key] ?? null;
}

function family(unit: string | null | undefined): UnitFamily {
  const key = normalizeUnit(unit);
  if (key in WEIGHT_TO_GRAMS) return 'weight';
  if (key in VOLUME_TO_ML) return 'volume';
  return 'count';
}

export function isConvertible(unit: string | null | undefined): boolean {
  const f = family(unit);
  return f === 'weight' || f === 'volume';
}

/** Mirrors Android ProductQuantityHelper.effectiveAvailableQuantity */
export function effectiveAvailableQuantity(
  category: string | null | undefined,
  description: string | null | undefined,
  availableQuantity: number,
): number {
  if (!/^PropertyLease/i.test(category ?? '')) return availableQuantity;
  const match = /^(?:Total Area:\s*)([\d.]+)/im.exec(description ?? '');
  const totalArea = match?.[1] ? Number.parseFloat(match[1]) : NaN;
  if (
    Number.isFinite(totalArea)
    && Math.abs(availableQuantity - 1) < 1e-9
    && Math.abs(totalArea - 1) > 1e-9
  ) {
    return totalArea;
  }
  return availableQuantity;
}

/**
 * Mirrors Android UnitConverter.buyableUnitsFor(sellerUnit) for UI dropdown.
 * Returns display units in Android order.
 */
export function buyableUnitsFor(sellerUnit: string | null | undefined): string[] {
  if (!sellerUnit) return [];
  const normalized = normalizeUnit(sellerUnit);
  if (!normalized) return [];

  const f = family(normalized);
  if (f === 'weight') return [...WEIGHT_DISPLAY_ORDER];
  if (f === 'volume') return [...VOLUME_DISPLAY_ORDER];
  return [];
}

export function compatible(a: string | null | undefined, b: string | null | undefined): boolean {
  const fa = family(a);
  const fb = family(b);
  return fa !== 'count' && fa === fb;
}

export function toBase(qty: number, unit: string): number {
  const f = factor(unit);
  return f == null ? qty : qty * f;
}

export function fromBase(qtyBase: number, unit: string): number {
  const f = factor(unit);
  return f == null ? qtyBase : qtyBase / f;
}

/** Convert quantity between compatible units (Android UnitConverter.convert). */
export function convert(qty: number, fromUnit: string | null | undefined, toUnit: string | null | undefined): number {
  if (!compatible(fromUnit, toUnit)) return qty;
  if (normalizeUnit(fromUnit) === normalizeUnit(toUnit)) return qty;
  return fromBase(toBase(qty, fromUnit ?? ''), toUnit ?? '');
}

/**
 * Converts a price quoted per fromUnit into the equivalent price per toUnit.
 * Example: ₹50/kg → ₹50,000/ton.
 */
export function convertPrice(
  price: number,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
): number {
  if (!compatible(fromUnit, toUnit)) return price;
  if (normalizeUnit(fromUnit) === normalizeUnit(toUnit)) return price;
  return price * convert(1, toUnit, fromUnit);
}

export function priceInUnit(
  pricePerListingUnit: number,
  listingUnit: string | null | undefined,
  targetUnit: string | null | undefined,
): number {
  if (!compatible(listingUnit, targetUnit)) return pricePerListingUnit;
  if (normalizeUnit(listingUnit) === normalizeUnit(targetUnit)) return pricePerListingUnit;
  return convertPrice(pricePerListingUnit, listingUnit, targetUnit);
}

/**
 * Line total when price is per listingUnit and the buyer orders buyQty in buyUnit.
 * Matches Android UnitConverter.calculatePurchaseTotal (rupees, 2 decimal places).
 */
export function calculatePurchaseTotal(params: {
  pricePerListingUnit: number;
  buyQty: number;
  buyUnit: string | null | undefined;
  listingUnit: string | null | undefined;
  multiplier?: number;
  basePrice?: number;
}): number {
  const {
    pricePerListingUnit,
    buyQty,
    buyUnit,
    listingUnit,
    multiplier = 1,
    basePrice = 0,
  } = params;

  const qtyInListing = isConvertible(listingUnit) && compatible(buyUnit, listingUnit)
    ? convert(buyQty, buyUnit, listingUnit)
    : buyQty;
  const subtotal = basePrice + pricePerListingUnit * qtyInListing * multiplier;
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * 100) / 100;
}

/** Seller listing unit used for stored price (Android ProductQuantityHelper.parseListingUnit). */
export function parseSellerListingUnit(unit: string, listingUnit?: string | null): string {
  if (listingUnit?.trim()) return listingUnit.trim();
  return normalizeUnit(unit);
}

export function formatQty(qty: number): string {
  if (!Number.isFinite(qty)) return '0';
  if (Number.isInteger(qty)) return String(qty);
  const rounded = Math.round(qty * 1000) / 1000;
  return String(rounded);
}

/** Formats rupee amounts; up to 2 decimal places when needed (Android formatPrice). */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) < 1e-12) return '0';
  if (Math.abs(value % 1) < 1e-9) return String(Math.trunc(value));
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded % 1) < 1e-9) return String(Math.trunc(rounded));
  return rounded.toFixed(2);
}

/** Android UnitConverter.subtractBaseStock — clamp remaining stock to 0.001 precision. */
export function subtractBaseStock(currentBase: number, deductBase: number): number {
  const remaining = currentBase - deductBase;
  if (remaining <= 0) return 0;
  return Math.round(remaining * 1000) / 1000;
}

function extractTextField(description: string, label: string): string | undefined {
  const regex = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*(.+)$`, 'im');
  return regex.exec(description)?.[1]?.trim();
}

function parseQuantityLineUnit(description: string, key: string): string | undefined {
  // Important: many Android descriptions are like:
  //   "Available Quantity: 5"  (no unit on the same line)
  // If we allow `\\s+` after the number, the regex can "spill" across newlines
  // and accidentally treat the next line's first token ("Minimum...", "Capacity...", etc.)
  // as the "unit", breaking base-unit conversions.
  const match = new RegExp(
    `(?:^|\\r?\\n)${key}:\\s*[\\d.]+[ \\t]+([^\\s\\r\\n]+)`,
    'i',
  ).exec(description);
  return match?.[1]?.trim() || undefined;
}

export function parseListingUnit(unit: string, listingUnit?: string | null): string {
  if (listingUnit?.trim()) return listingUnit.trim();
  return normalizeUnit(unit);
}

export function storageUsesBaseUnits(listingUnit?: string | null): boolean {
  return Boolean(listingUnit?.trim()) && isConvertible(listingUnit);
}

export function parseAvailableQuantityUnit(description: string, listingUnit: string): string {
  const fromField = extractTextField(description, 'Available Quantity Unit');
  if (fromField) return normalizeUnit(fromField) || fromField;
  const fromLine = parseQuantityLineUnit(description, 'Available Quantity')
    ?? parseQuantityLineUnit(description, 'Quantity');
  if (fromLine) return normalizeUnit(fromLine) || fromLine;
  return listingUnit;
}

export function parseMinOrderUnit(description: string, listingUnit: string): string {
  const fromField = extractTextField(description, 'Minimum Order Unit');
  if (fromField) return normalizeUnit(fromField) || fromField;
  const fromLine = parseQuantityLineUnit(description, 'Minimum Order');
  if (fromLine) return normalizeUnit(fromLine) || fromLine;
  return listingUnit;
}

export function parsePriceUnit(description: string, listingUnit: string, unitField?: string): string {
  // Prefer the product.unit field when present ("per kg" → "kg") so we don't
  // flip to a mismatched Price Unit line (e.g. "grams") while price is ₹/kg.
  const fromUnitField = normalizeUnit(unitField);
  if (fromUnitField) return fromUnitField;
  const fromField = extractTextField(description, 'Price Unit');
  if (fromField) return normalizeUnit(fromField) || fromField;
  return listingUnit;
}

export function parsePricePerQuantity(description: string): number {
  const raw = extractTextField(description, 'Price per Quantity');
  const n = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export interface ProductQuantityDisplay {
  /** Bare unit for quantity inputs/suffixes, e.g. "kg". */
  quantityUnit: string;
  /** Bare unit used for price label, e.g. "kg". */
  priceUnit: string;
  /** e.g. "/ kg" — never "/ per kg". Dual: "/ hr + ₹400 / sq meter". */
  priceUnitLabel: string;
  /** e.g. "per kg" for details subtitle style. Dual: "per hr + ₹400 / sq meter". */
  pricePerLabel: string;
  /** Second (quantity) price for Tent House / Warehousing; 0 if none. */
  quantityPrice: number;
  quantityPriceUnit: string;
  displayAvailable: number;
  displayMinOrder: number;
  availableText: string;
  minOrderText: string;
  priceText: string;
}

export function getProductQuantityDisplay(params: {
  description: string;
  unit: string;
  listingUnit?: string | null;
  price: number;
  availableQuantity: number;
  minOrder: number;
}): ProductQuantityDisplay {
  const listingUnit = parseListingUnit(params.unit, params.listingUnit);
  const availableUnit = parseAvailableQuantityUnit(params.description, listingUnit) || listingUnit;
  const minUnit = parseMinOrderUnit(params.description, listingUnit) || listingUnit;
  const priceUnit = parsePriceUnit(params.description, listingUnit, params.unit) || listingUnit;
  const usesBase = storageUsesBaseUnits(params.listingUnit);

  const displayAvailable = usesBase && isConvertible(availableUnit)
    ? fromBase(params.availableQuantity, availableUnit)
    : params.availableQuantity;
  const displayMinOrder = usesBase && isConvertible(minUnit)
    ? fromBase(params.minOrder, minUnit)
    : (params.minOrder > 0 ? params.minOrder : 1);

  // Android ProductQuantityHelper.displayPricePerUnit — convert stored listing-unit price for display.
  const displayPrice = isConvertible(listingUnit)
    && normalizeUnit(priceUnit) !== normalizeUnit(listingUnit)
    ? priceInUnit(params.price, listingUnit, priceUnit)
    : params.price;

  const quantityUnit = availableUnit || minUnit || normalizeUnit(params.unit) || listingUnit;
  const quantityPrice = parsePricePerQuantity(params.description);
  const quantityPriceUnit = quantityPrice > 0
    ? (extractTextField(params.description, 'Available Quantity Unit') || 'items')
    : '';
  const dualSuffix = quantityPrice > 0
    ? `${priceUnit ? `per ${priceUnit} ` : ''}+ ₹${formatPrice(quantityPrice)} / ${quantityPriceUnit}`
    : '';
  const priceUnitLabel = dualSuffix
    ? (priceUnit ? `/ ${priceUnit} + ₹${formatPrice(quantityPrice)} / ${quantityPriceUnit}` : `+ ₹${formatPrice(quantityPrice)} / ${quantityPriceUnit}`)
    : (priceUnit ? `/ ${priceUnit}` : '');
  const pricePerLabel = dualSuffix || (priceUnit ? `per ${priceUnit}` : '');

  return {
    quantityUnit,
    priceUnit,
    priceUnitLabel,
    pricePerLabel,
    quantityPrice,
    quantityPriceUnit,
    displayAvailable,
    displayMinOrder,
    availableText: displayAvailable > 0
      ? `${formatQty(displayAvailable)}${quantityUnit ? ` ${quantityUnit}` : ''}`
      : 'Not specified',
    minOrderText: `${formatQty(displayMinOrder)}${minUnit || quantityUnit ? ` ${minUnit || quantityUnit}` : ''}`,
    priceText: `₹${formatPrice(displayPrice)}${priceUnitLabel ? ` ${priceUnitLabel}` : ''}`,
  };
}
