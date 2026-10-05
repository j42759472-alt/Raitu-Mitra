/** Property lease/sale helpers — mirrors Android PropertyLeaseFragment. */

export const LEASE_OR_SALE_OPTIONS = ['For Lease', 'For Sale'] as const;
export const AREA_UNIT_OPTIONS = ['Acres', 'Hectares', 'Sq Feet', 'Sq Meters', 'Guntas', 'Cents'] as const;

export type LeaseOrSale = (typeof LEASE_OR_SALE_OPTIONS)[number];
export type AreaUnit = (typeof AREA_UNIT_OPTIONS)[number];

export interface PropertyListingForm {
  title: string;
  leaseOrSale: LeaseOrSale;
  totalArea: string;
  areaUnit: AreaUnit;
  priceUnit: AreaUnit;
  minOrder: string;
  minOrderUnit: AreaUnit;
  price: string;
  location: string;
  surveyNo?: string;
  soilType?: string;
  waterSource?: string;
  fencing?: string;
  electricity?: string;
  roadAccess?: string;
  leaseDuration?: string;
  description?: string;
}

export function buildPropertyDescription(form: PropertyListingForm): string {
  const areaNumeric = Number(form.totalArea);
  const minOrderVal = Number(form.minOrder);
  const area = `${form.totalArea} ${form.areaUnit}`;

  const lines: string[] = [];
  if (form.description?.trim()) {
    lines.push(form.description.trim(), '');
  }
  lines.push(`Lease or Sale: ${form.leaseOrSale}`);
  lines.push(`Total Area: ${area}`);
  lines.push(`Minimum Order: ${formatQtyValue(minOrderVal)} ${form.minOrderUnit}`);
  lines.push(`Minimum Order Unit: ${form.minOrderUnit}`);
  lines.push(`Price Unit: ${form.priceUnit}`);
  if (form.surveyNo?.trim()) lines.push(`Survey / Plot No: ${form.surveyNo.trim()}`);
  if (form.soilType?.trim()) lines.push(`Soil Type: ${form.soilType.trim()}`);
  if (form.waterSource?.trim()) lines.push(`Water Source: ${form.waterSource.trim()}`);
  if (form.fencing?.trim()) lines.push(`Fencing / Compound: ${form.fencing.trim()}`);
  if (form.electricity?.trim()) lines.push(`Electricity: ${form.electricity.trim()}`);
  if (form.roadAccess?.trim()) lines.push(`Road Access: ${form.roadAccess.trim()}`);
  if (form.leaseDuration?.trim()) lines.push(`Lease Duration: ${form.leaseDuration.trim()}`);
  return lines.join('\n').trim();
}

export function validatePropertyForm(form: PropertyListingForm): string | null {
  if (!form.title.trim()) return 'Property title is required.';
  if (!form.price.trim() || !(Number(form.price) > 0)) return 'Enter a valid price.';
  if (!form.totalArea.trim()) return 'Total area is required.';
  const areaNumeric = Number(form.totalArea);
  if (!Number.isFinite(areaNumeric) || areaNumeric <= 0) return 'Total area must be greater than 0.';
  if (!form.minOrder.trim()) return 'Minimum order is required.';
  const minOrderVal = Number(form.minOrder);
  if (!Number.isFinite(minOrderVal) || minOrderVal <= 0) return 'Minimum order must be greater than 0.';
  if (form.minOrderUnit === form.areaUnit && minOrderVal > areaNumeric) {
    return 'Minimum order cannot exceed total area.';
  }
  if (!form.location.trim()) return 'Location is required.';
  return null;
}

function formatQtyValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
