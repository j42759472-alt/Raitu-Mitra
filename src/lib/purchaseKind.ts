/**
 * Android ProductDetailsFragment purchase classification —
 * rental vs normal buy is driven by category/unit, not offering_type alone.
 */

export function isTransportCategory(category: string | null | undefined): boolean {
  return (category ?? '').toLowerCase().includes('transport');
}

export function isTransportExceptTrucks(category: string | null | undefined): boolean {
  const cat = category ?? '';
  return /transport/i.test(cat) && !/trucks/i.test(cat);
}

export function isVehiclesPassengerCategory(category: string | null | undefined): boolean {
  const cat = (category ?? '').toLowerCase();
  return (
    cat.includes('cars')
    || cat.includes('seater')
    || cat.includes('passengers')
    || cat.includes('bikes')
    || cat.includes('autorickshaw')
    || cat.includes('auto rickshaw')
  );
}

/** Android ProductDetailsFragment.isEquipmentRental */
export function isEquipmentRentalCategory(
  category: string | null | undefined,
  unit?: string | null,
): boolean {
  const cat = category ?? '';
  // Property Lease / Sale uses Groceries-style qty × unit price, not duration × equipment.
  if (/^PropertyLease/i.test(cat)) return false;
  const byPrefix = (
    /^Drones/i.test(cat)
    || /^Tractor/i.test(cat)
    || /^Thresher/i.test(cat)
    || /^Harvester/i.test(cat)
    || /^Cultivator/i.test(cat)
    || /^Borewells/i.test(cat)
    || /^StonePicker/i.test(cat)
    || /^HeavyEquipment_Others/i.test(cat)
    || /^Manual/i.test(cat)
    || /^Transport/i.test(cat)
    || /^Tent House/i.test(cat)
    || /^Warehousing/i.test(cat)
  );
  if (byPrefix) return true;
  const u = unit ?? '';
  return (
    /acre/i.test(u)
    || /hour/i.test(u)
    || /day/i.test(u)
    || /week/i.test(u)
    || /month/i.test(u)
  );
}

/** True when rental UI should ask for equipment/item count (not Grazing/Packing/Transport). */
export function rentalAsksEquipmentCount(category: string | null | undefined): boolean {
  const cat = category ?? '';
  if (/grazing/i.test(cat) || /packing/i.test(cat) || /transport/i.test(cat)) return false;
  return isEquipmentRentalCategory(cat);
}

export function primaryCtaLabel(params: {
  isOwn: boolean;
  isWorker: boolean;
  category: string;
}): string {
  if (params.isOwn) return 'Edit Listing';
  if (params.isWorker) return 'Hire Now';
  // Android ProductDetailsFragment: only Transport overrides main CTA to Book Now
  if (isTransportCategory(params.category)) return 'Book Now';
  return 'Buy Now';
}

export function quantityDialogConfirmLabel(isRental: boolean): string {
  return isRental ? 'Book Now' : 'Buy Now';
}
