import { isConvertible, normalizeUnit } from './units';

export type DeliveryFilter = 'any' | 'yes' | 'no';

export interface FilterState {
  minDistance: number | null;
  maxDistance: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  selectedPriceUnit: string | null;
  minMembers: number | null;
  maxMembers: number | null;
  minTotalArea: number | null;
  maxTotalArea: number | null;
  homeDelivery: DeliveryFilter;
}

export const EMPTY_FILTER_STATE: FilterState = {
  minDistance: 0,
  maxDistance: null,
  minPrice: 0,
  maxPrice: null,
  selectedPriceUnit: null,
  minMembers: null,
  maxMembers: null,
  minTotalArea: null,
  maxTotalArea: null,
  homeDelivery: 'any',
};

export function cloneFilterState(state: FilterState = EMPTY_FILTER_STATE): FilterState {
  return { ...state };
}

export function isFilterActive(
  state: FilterState,
  showDelivery = true,
  showMembers = false,
  showTotalArea = false,
): boolean {
  const distActive = (state.minDistance != null && state.minDistance !== 0) || state.maxDistance != null;
  const priceActive = (state.minPrice != null && state.minPrice !== 0) || state.maxPrice != null;
  const unitActive = Boolean(state.selectedPriceUnit?.trim());
  const membersActive = showMembers && (state.minMembers != null || state.maxMembers != null);
  const areaActive = showTotalArea && (
    (state.minTotalArea != null && state.minTotalArea !== 0) || state.maxTotalArea != null
  );
  const deliveryActive = showDelivery && state.homeDelivery !== 'any';
  return distActive || priceActive || unitActive || membersActive || areaActive || deliveryActive;
}

function unitsCompatible(itemUnit: string | null | undefined, selectedUnit: string): boolean {
  const a = normalizeUnit(itemUnit);
  const b = normalizeUnit(selectedUnit);
  if (!b) return true;
  if (isConvertible(b)) {
    // Same family if both convertible to same base type (weight vs volume)
    if (!isConvertible(a)) return false;
    const weight = ['ton', 'tonne', 'quintal', 'kg', 'kilogram', 'kilograms', 'grams', 'gram', 'g'];
    const volume = ['liter', 'litre', 'liters', 'litres', 'l', 'ml', 'milliliter', 'millilitre'];
    const aWeight = weight.includes(a);
    const bWeight = weight.includes(b);
    const aVol = volume.includes(a);
    const bVol = volume.includes(b);
    if (aWeight && bWeight) return true;
    if (aVol && bVol) return true;
    return false;
  }
  return a === b;
}

export function matchesFilter(
  state: FilterState,
  opts: {
    /** Omit when distance is unknown (skip distance gates). Pass null to fail if minDistance > 0. */
    distance?: number | null;
    price: number;
    itemUnit?: string | null;
    deliveryMaxDistance?: number | null;
    memberCount?: number;
    totalArea?: number | null;
  },
): boolean {
  const { price, itemUnit = null, deliveryMaxDistance = null, memberCount = 1, totalArea = null } = opts;
  const hasDistance = Object.prototype.hasOwnProperty.call(opts, 'distance');
  const distance = opts.distance ?? null;

  if (hasDistance) {
    if (distance != null) {
      if (state.minDistance != null && distance < state.minDistance) return false;
      if (state.maxDistance != null && distance > state.maxDistance) return false;
    } else if (state.minDistance != null && state.minDistance > 0) {
      return false;
    }
  }

  if (state.selectedPriceUnit?.trim()) {
    if (!unitsCompatible(itemUnit, state.selectedPriceUnit)) return false;
  }

  if (state.minPrice != null && price < state.minPrice) return false;
  if (state.maxPrice != null && price > state.maxPrice) return false;

  if (state.homeDelivery !== 'any') {
    const hasDelivery = deliveryMaxDistance != null && deliveryMaxDistance > 0;
    if (state.homeDelivery === 'yes' && !hasDelivery) return false;
    if (state.homeDelivery === 'no' && hasDelivery) return false;
  }

  if (state.minMembers != null && memberCount < state.minMembers) return false;
  if (state.maxMembers != null && memberCount > state.maxMembers) return false;

  if (state.minTotalArea != null && state.minTotalArea > 0) {
    if (totalArea == null || totalArea < state.minTotalArea) return false;
  }
  if (state.maxTotalArea != null) {
    if (totalArea == null || totalArea > state.maxTotalArea) return false;
  }

  return true;
}

/** Parse "Total Area: 9 Acres" from a property description. */
export function parseTotalArea(description: string): number | null {
  const match = /^Total Area:\s*([\d.]+)/im.exec(description);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

/** Parse "Maximum Distance applicable for Home Delivery: X km" from description. */
export function parseDeliveryMaxDistance(description: string): number | null {
  const match = /Maximum Distance applicable for Home Delivery:\s*([\d.]+)/i.exec(description);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}
