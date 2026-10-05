/** Transport listing helpers — mirrors Android ServiceFragment pooling logic. */

export type PoolingOption = 'Pooling' | 'Solo';

export function getPoolingOption(description: string): PoolingOption {
  return /Pooling Option:\s*Pooling/i.test(description) ? 'Pooling' : 'Solo';
}

export function isTransportPoolingEligible(subcategory?: string, sellCategory?: string): boolean {
  const sub = (subcategory ?? '').trim();
  const cat = (sellCategory ?? '').trim();
  return sub === 'Cars' || sub === 'Auto Rickshaws' || cat.includes('Passengers');
}

export function isKmOnlyTransport(subcategory?: string, sellCategory?: string): boolean {
  const sub = (subcategory ?? '').trim();
  const cat = (sellCategory ?? '').trim();
  if (sub === 'Cars' || sub === 'Bikes' || sub === 'Auto Rickshaws') return true;
  if (cat === 'Cars' || cat === 'Bikes' || cat === 'Auto Rickshaws') return true;
  if (cat.includes('Passengers')) return true;
  return ['Two Wheeler', 'Electric Bike', 'Scooter'].includes(cat);
}

export function maxPassengersFromCategory(category: string): number {
  const match = /\+\s*(\d+)\s*Passengers/i.exec(category);
  return match?.[1] ? Number.parseInt(match[1], 10) || 1 : 1;
}

export function buildTransportSellDescription(params: {
  baseDescription?: string;
  company?: string;
  brandModel?: string;
  capacity?: string;
  fuelConsumption?: string;
  poolingOption?: PoolingOption;
  minOrderEquipment?: string;
  minOrderDuration?: string;
  unit?: string;
  includePooling?: boolean;
}): string {
  const lines: string[] = [];
  if (params.baseDescription?.trim()) lines.push(params.baseDescription.trim());
  if (params.company?.trim()) lines.push(`Company: ${params.company.trim()}`);
  if (params.brandModel?.trim()) lines.push(`Brand and Model: ${params.brandModel.trim()}`);
  if (params.capacity?.trim()) lines.push(`Capacity: ${params.capacity.trim()}`);
  if (params.fuelConsumption?.trim()) lines.push(`Fuel Consumption: ${params.fuelConsumption.trim()}`);
  if (params.includePooling && params.poolingOption) {
    lines.push(`Pooling Option: ${params.poolingOption}`);
  }
  lines.push(`Minimum Order Equipment: ${params.minOrderEquipment?.trim() || '1'}`);
  if (params.minOrderDuration?.trim() && params.unit) {
    lines.push(`Minimum Order Duration: ${params.minOrderDuration.trim()} per ${params.unit}`);
  }
  return lines.join('\n').trim();
}

export function buildTransportCategory(subcategory: string | undefined, sellCategory: string): string {
  const sub = (subcategory ?? '').trim();
  const leaf = sellCategory.trim() || 'Others';
  if (sub && sub !== 'Others') return `Transport|${sub}|${leaf}`;
  return `Transport|${leaf}`;
}
