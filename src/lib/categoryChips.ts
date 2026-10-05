/**
 * Sub-filter chips + listing match helpers — mirrors Android marketplace fragments.
 */

/** Resolve Android DB category prefix(es) for a home catalog route. */
export function getAndroidCategoryPrefixes(section: string, subcategory?: string): string[] {
  const sec = (section ?? '').trim();
  const sub = (subcategory ?? '').trim();
  const secLower = sec.toLowerCase();
  const subLower = sub.toLowerCase();

  // Animal Husbandry
  if (/animal\s*husbandry/i.test(sec) || isHusbandrySub(sub)) {
    if (/mobile\s*grazing/i.test(sub)) return ['Grazing|'];
    if (subLower === 'others') return ['Husbandry|Others|', 'Husbandry|Others'];
    if (sub) return [`Husbandry|${sub}|`];
    return ['Husbandry|'];
  }

  // Groceries
  if (/grocer/i.test(sec)) {
    if (subLower === 'others') return ['Groceries|Others', 'Groceries|Others|'];
    if (sub) return [`Groceries|${sub}|`];
    return ['Groceries|'];
  }

  // Farm Inputs
  if (/farm\s*inputs/i.test(sec)) {
    if (/seeds/i.test(sub)) return ['Seeds|'];
    if (subLower === 'others') return ['FarmInputs_Others|'];
    if (sub) return [`${sub}|`]; // Fertilizers|, Pesticides|
    return ['Fertilizers|', 'Pesticides|', 'Seeds|', 'FarmInputs_Others|'];
  }

  // Farm Equipment
  if (/farm\s*equipment/i.test(sec)) {
    if (/drone/i.test(sub)) return ['Drones|'];
    if (/manual/i.test(sub)) return ['Manual|'];
    if (/thresher/i.test(sub)) return ['Thresher|'];
    if (/harvester/i.test(sub)) return ['Harvester|'];
    if (/cutivator|cultivator/i.test(sub)) return ['Cultivator|'];
    if (/tractor/i.test(sub)) return ['Tractor|'];
    if (/stone/i.test(sub)) return ['StonePicker|'];
    if (/borewell/i.test(sub)) return ['Borewells|'];
    if (subLower === 'others') return ['HeavyEquipment_Others|'];
    return ['Drones|', 'Thresher|', 'Harvester|', 'Cultivator|', 'Tractor|', 'StonePicker|', 'Borewells|', 'Manual|', 'HeavyEquipment_Others|'];
  }

  // Transport
  if (/transport/i.test(sec)) {
    if (subLower === 'others') return ['Transport|Others', 'Transport|Others|'];
    if (sub) return [`Transport|${sub}|`];
    return ['Transport|'];
  }

  // Events — Android opens ServiceFragment with type = Wedding / Tent House / Catering
  if (/events/i.test(sec)) {
    if (/wedding/i.test(sub)) return ['Wedding|', 'Events|Wedding|'];
    if (/tent/i.test(sub)) return ['Tent House|', 'Events|Tent House|'];
    if (/cater/i.test(sub)) return ['Catering|', 'Events|Catering|'];
    if (subLower === 'others') return ['Events|Others', 'Events|Others|'];
    return ['Wedding|', 'Tent House|', 'Catering|', 'Events|'];
  }

  // Tertiary
  if (/tertiary/i.test(sec)) {
    if (/warehous/i.test(sub)) return ['Warehousing|', 'Tertiary|Warehousing|'];
    if (/pack/i.test(sub)) return ['Packing|', 'Tertiary|Packing|'];
    if (subLower === 'others') return ['Tertiary|Others', 'Tertiary|Others|'];
    return ['Warehousing|', 'Packing|', 'Tertiary|'];
  }

  // Property
  if (/property/i.test(sec)) {
    if (sub) return [`PropertyLease|${sub}`, `PropertyLease|${sub}|`];
    return ['PropertyLease|'];
  }

  if (sub) return [`${sub}|`, `${sec}|${sub}|`];
  return sec ? [`${sec}|`] : [];
}

/**
 * Sub-filter chips per marketplace screen — mirrors Android fragment chip lists.
 */
export function getBuyFilterChips(section: string, subcategory?: string): string[] {
  const sub = (subcategory ?? '').trim();
  const sec = (section ?? '').trim();

  // Animal Husbandry
  if (/animal\s*husbandry/i.test(sec) || isHusbandrySub(sub)) {
    switch (sub) {
      case 'Cattle':
        return ['All', 'Cow', 'Buffalo', 'Bull', 'Calf', 'Others'];
      case 'Poultry':
        return ['All', 'Chicken', 'Duck', 'Turkey', 'Others'];
      case 'Animal Feed':
        return ['All', 'Green Fodder', 'Dry Fodder', 'Concentrate Feed', 'Silage', 'Others'];
      case 'Mobile Grazing':
        return ['All', 'Cattle', 'Sheep', 'Goats', 'Ducks', 'Others'];
      case 'Others':
        return [];
      default:
        return sub ? ['All', 'Others'] : ['All'];
    }
  }

  // Groceries
  if (/grocer/i.test(sec)) {
    const grocerySubs: Record<string, string[]> = {
      Fruits: ['All', 'Bananas', 'Mangoes', 'Apples', 'Grapes', 'Guava', 'Others'],
      Vegetables: ['All', 'Tomatoes', 'Onions', 'Potatoes', 'Carrots', 'Leafy Greens', 'Others'],
      Grains: ['All', 'Rice', 'Wheat', 'Millets', 'Pulses', 'Others'],
      Meat: ['All', 'Chicken', 'Mutton', 'Fish', 'Others'],
      Dairy: ['All', 'Milk', 'Ghee', 'Curd', 'Butter', 'Others'],
      Eggs: ['All', 'Country Eggs', 'Farm Eggs', 'Duck Eggs', 'Quail Eggs', 'Others'],
      Sugars: ['All', 'White Sugar', 'Brown Sugar', 'Jaggery', 'Palm Sugar', 'Others'],
      Oils: ['All', 'Sunflower Oil', 'Groundnut Oil', 'Coconut Oil', 'Mustard Oil', 'Others'],
      Spices: ['All', 'Chilli', 'Turmeric', 'Cumin', 'Pepper', 'Others'],
      Others: [],
    };
    return grocerySubs[sub] ?? ['All', 'Others'];
  }

  // Farm Inputs
  if (/farm\s*inputs/i.test(sec)) {
    const inputSubs: Record<string, string[]> = {
      Fertilizers: ['All', 'Organic', 'Chemical', 'Soil Conditioners', 'Others'],
      Pesticides: ['All', 'Organic', 'Chemical', 'Biological', 'Others'],
      'Seeds & Saplings': ['All', 'Vegetables', 'Fruits', 'Cereals', 'Saplings', 'Others'],
      Others: [],
    };
    return inputSubs[sub] ?? ['All', 'Others'];
  }

  // Farm Equipment
  if (/farm\s*equipment/i.test(sec)) {
    if (/drone/i.test(sub)) {
      return ['All', 'Pesticide spraying', 'fertilizing', 'soil analysis', 'Crop health monitoring', 'Others'];
    }
    if (/manual/i.test(sub)) {
      return ['All', 'Hand Tools', 'Seed Drill', 'Spray Pump', 'Others'];
    }
    if (/thresher/i.test(sub)) {
      return ['All', 'Multi-crop Thresher', 'Paddy Thresher', 'Maize Thresher', 'Others'];
    }
    if (/harvester/i.test(sub)) {
      return ['All', 'Combine Harvester', 'Forage Harvester', 'Sugarcane Harvester', 'Others'];
    }
    if (/cutivator|cultivator/i.test(sub)) {
      return ['All', 'Combine Cultivator', 'Forage Cultivator', 'Sugarcane Cultivator', 'Others'];
    }
    if (/tractor/i.test(sub)) {
      return ['All', 'Small Tractor', 'Large Tractor', 'Mini Tractor', 'Others'];
    }
    if (/stone/i.test(sub)) {
      return ['All', 'Stone Picker', 'Rock Picker', 'Land Cleaner', 'Others'];
    }
    if (/borewell/i.test(sub)) {
      return ['All', '4.5 Inch Borewell', '6.5 Inch Borewell', 'Side Borewell', 'Others'];
    }
    if (/others/i.test(sub)) return [];
    return sub ? ['All', 'Others'] : ['All'];
  }

  // Transport
  if (/transport/i.test(sec)) {
    const transportSubs: Record<string, string[]> = {
      Trucks: ['All', 'Heavy Duty', 'Light Duty', 'Container', 'Open Body', 'Others'],
      Cars: ['All', 'D + 4 Passengers', 'D + 6 Passengers', 'D + 8 Passengers', 'Others'],
      Bikes: ['All', 'Two Wheeler', 'Electric Bike', 'Scooter', 'Others'],
      'Auto Rickshaws': ['All', 'D + 3 Passengers', 'D + 6 Passengers', 'D + 9 Passengers', 'Others'],
      Others: [],
    };
    return transportSubs[sub] ?? ['All', 'Trucks', 'Cars', 'Bikes', 'Auto Rickshaws', 'Others'];
  }

  // Events
  if (/events/i.test(sec)) {
    if (/wedding/i.test(sub)) return ['All', 'Photography', 'Stage Decor', 'Music/DJ', 'Makeup', 'Others'];
    if (/tent/i.test(sub)) return ['All', 'Tents', 'Chairs/Tables', 'Lighting', 'Others'];
    if (/cater/i.test(sub)) return ['All', 'Small Event', 'Grand Wedding', 'Corporate', 'Others'];
    if (/others/i.test(sub)) return [];
    return ['All', 'Wedding', 'Tent House', 'Catering', 'Others'];
  }

  // Tertiary
  if (/tertiary/i.test(sec)) {
    if (/warehous/i.test(sub)) return ['All', 'Cold Storage', 'Dry Warehouse', 'Silo', 'Others'];
    if (/pack/i.test(sub)) return ['All', 'Box Packing', 'Bagging', 'Labeling', 'Others'];
    if (/others/i.test(sub)) return [];
    return ['All', 'Warehousing', 'Packing', 'Others'];
  }

  // Property — Android PropertyLeaseFragment has no subtype chips for a given type
  if (/property/i.test(sec)) {
    return [];
  }

  if (/others/i.test(sub)) return [];
  if (sub) return ['All', 'Others'];
  return ['All'];
}

function isHusbandrySub(sub: string): boolean {
  // Do NOT include "Others" — that label is shared across every home section.
  return ['Cattle', 'Poultry', 'Animal Feed', 'Mobile Grazing'].includes(sub);
}

/** Default unit hint for Sell form by section. */
export function getDefaultSellUnit(section: string, subcategory?: string): string {
  const sec = (section ?? '').toLowerCase();
  const sub = (subcategory ?? '').toLowerCase();
  if (sec.includes('husbandry') && (sub.includes('cattle') || sub.includes('poultry'))) return 'per animal';
  if (sec.includes('husbandry') && sub.includes('feed')) return 'per kg';
  if (sec.includes('grazing') || sub.includes('grazing')) return 'per day';
  if (sec.includes('grocer') || sec.includes('farm inputs')) return 'per kg';
  if (sec.includes('equipment') || sec.includes('transport') || sec.includes('events') || sec.includes('tertiary')) {
    return 'per day';
  }
  if (sec.includes('property')) return 'per acre';
  return 'per unit';
}

/** Sell field labels adapted per category family — mirrors Android fragment tab text. */
export function getSellFieldLabels(section: string, subcategory?: string): {
  nameHint: string;
  brandLabel: string;
  brandHint: string;
  showBrand: boolean;
  buyLabel: string;
  sellLabel: string;
} {
  const sec = (section ?? '').toLowerCase();
  const sub = (subcategory ?? '').trim() || 'Item';
  const subLower = sub.toLowerCase();

  // PropertyLeaseFragment
  if (sec.includes('property')) {
    return {
      nameHint: 'e.g. 2 acre irrigated land',
      brandLabel: 'Soil / Water notes',
      brandHint: 'Optional details',
      showBrand: true,
      buyLabel: 'Browse',
      sellLabel: 'Post Property',
    };
  }

  // ServiceFragment when serviceType == Transport
  if (sec.includes('transport')) {
    return {
      nameHint: `e.g. ${sub}`,
      brandLabel: 'Brand / Model',
      brandHint: 'e.g. Tata / Mahindra',
      showBrand: true,
      buyLabel: 'Book',
      sellLabel: 'Offer',
    };
  }

  // Drone / Heavy / Manual equipment + Mobile Grazing → Buy/Hire · Sell/Offer
  if (
    sec.includes('equipment')
    || subLower.includes('grazing')
    || subLower.includes('drone')
    || subLower.includes('manual')
  ) {
    return {
      nameHint: `e.g. ${sub}`,
      brandLabel: 'Brand / Model',
      brandHint: 'e.g. Mahindra / DJI',
      showBrand: true,
      buyLabel: 'Buy/Hire',
      sellLabel: 'Sell/Offer',
    };
  }

  if (sec.includes('husbandry') && (sub === 'Cattle' || sub === 'Poultry')) {
    return {
      nameHint: 'e.g. Milk Cow',
      brandLabel: 'Breed / Company Name',
      brandHint: 'e.g. Gir / Murrah',
      showBrand: true,
      buyLabel: 'Buy',
      sellLabel: 'Sell',
    };
  }

  if (sec.includes('events') || sec.includes('tertiary')) {
    return {
      nameHint: `e.g. ${sub} service`,
      brandLabel: 'Provider / Company',
      brandHint: 'Optional',
      showBrand: true,
      buyLabel: 'Buy',
      sellLabel: 'Sell',
    };
  }

  return {
    nameHint: `e.g. ${sub}`,
    brandLabel: 'Brand / Variety',
    brandHint: 'Optional',
    showBrand: true,
    buyLabel: 'Buy',
    sellLabel: 'Sell',
  };
}

/**
 * Build Android-style category string when posting a Sell listing.
 */
export function buildSellCategory(
  section: string,
  subcategory: string | undefined,
  chipOrLeaf: string,
): string {
  const prefixes = getAndroidCategoryPrefixes(section, subcategory);
  const leaf = (chipOrLeaf || 'Others').trim();
  const primary = prefixes[0] ?? `${section}|`;
  const sub = (subcategory ?? '').trim();

  // Section-level Others tiles must post into their isolated prefix only.
  // e.g. Groceries|Others, HeavyEquipment_Others|Others, FarmInputs_Others|Others
  if (/^others$/i.test(sub)) {
    if (primary.endsWith('|')) {
      return `${primary}Others`;
    }
    if (/\|others$/i.test(primary)) return primary;
    return `${primary}|Others`;
  }

  // Prefixes that already end with | expect a leaf after them
  if (primary.endsWith('|')) {
    // Transport|Cars| already includes parent — append leaf
    // Husbandry|Cattle| → Husbandry|Cattle|Cow
    // Fertilizers| → Fertilizers|Organic
    // Wedding| → Wedding|Photography
    return `${primary}${leaf}`;
  }

  // PropertyLease|Agricultural Land (no chip leaf)
  if (/property/i.test(section)) {
    return primary;
  }

  return `${primary}|${leaf}`;
}

/**
 * Match listings the way Android fragments do.
 * Section-level "Others" is prefix-isolated (Groceries|Others ≠ HeavyEquipment_Others).
 */
export function matchesCategoryListing(
  item: { category: string; title: string; specificType: string; description: string },
  section: string,
  subcategory: string | undefined,
  chip: string,
): boolean {
  const cat = (item.category ?? '').trim();
  const catLower = cat.toLowerCase();
  const parts = cat.split('|').map((p) => p.trim()).filter(Boolean);
  const chipNorm = (chip ?? '').trim();
  const sub = (subcategory ?? '').trim();
  const sec = (section ?? '').trim();
  const prefixes = getAndroidCategoryPrefixes(sec, sub || undefined);
  const isSectionOthers = /^others$/i.test(sub);

  const prefixOk = prefixes.some((p) => {
    const pref = p.toLowerCase();
    if (!pref) return false;
    if (catLower.startsWith(pref)) return true;
    if (catLower === pref.replace(/\|$/, '')) return true;
    return false;
  });

  // Groceries Others / Farm Equipment Others / etc. — never match via a bare "Others" segment
  // in another section (e.g. Husbandry|Others must not appear under Groceries → Others).
  if (isSectionOthers) {
    if (!prefixOk) return false;
    return matchesChipFilter(parts, item, chipNorm);
  }

  const segmentOk = (() => {
    if (!sub) {
      if (!sec) return true;
      return prefixes.some((p) => catLower.startsWith(p.toLowerCase()))
        || parts.some((p) => p.toLowerCase().includes(sec.toLowerCase().split(/\s+/)[0] ?? ''));
    }
    const subLower = sub.toLowerCase();
    // Exact segment match only — never loose includes("others")
    if (parts.some((p) => p.toLowerCase() === subLower)) return true;
    if (parts[0]?.toLowerCase() === subLower) return true;
    if (parts[1]?.toLowerCase() === subLower) return true;
    if (/mobile\s*grazing/i.test(sub) && parts[0]?.toLowerCase() === 'grazing') return true;
    if (/drone/i.test(sub) && parts[0]?.toLowerCase() === 'drones') return true;
    if (/cutivator|cultivator/i.test(sub) && parts[0]?.toLowerCase() === 'cultivator') return true;
    if (/stone/i.test(sub) && parts[0]?.toLowerCase() === 'stonepicker') return true;
    if (/seeds/i.test(sub) && parts[0]?.toLowerCase() === 'seeds') return true;
    if (/manual/i.test(sub) && parts[0]?.toLowerCase() === 'manual') return true;
    if (/borewell/i.test(sub) && parts[0]?.toLowerCase() === 'borewells') return true;
    if (/property/i.test(sec) && catLower.startsWith('propertylease|')) {
      return parts[1]?.toLowerCase() === subLower || catLower === `propertylease|${subLower}`;
    }
    // Avoid catLower.includes(sub) — that made "Others" collide across sections
    return false;
  })();

  if (!prefixOk && !segmentOk) return false;
  return matchesChipFilter(parts, item, chipNorm);
}

function matchesChipFilter(
  parts: string[],
  item: { title: string; specificType: string; description: string },
  chipNorm: string,
): boolean {
  if (!chipNorm || chipNorm === 'All') return true;
  const chipLower = chipNorm.toLowerCase();
  const leaf = (parts[parts.length - 1] ?? item.specificType).toLowerCase();
  if (leaf === chipLower) return true;
  // Chip "Others" is only the leaf segment "Others" — not HeavyEquipment_Others / FarmInputs_Others
  if (chipLower === 'others') return leaf === 'others';
  if (parts.some((p) => p.toLowerCase() === chipLower)) return true;
  const hay = `${item.title} ${item.description} ${item.specificType}`.toLowerCase();
  return hay.includes(chipLower);
}

/** Android CustomHeaderView title: subcategory when present, else section.
 *  For shared label "Others", include the parent section so tiles stay distinct. */
export function categoryScreenTitle(section?: string, subcategory?: string): string {
  const sec = section?.trim() || '';
  const sub = subcategory?.trim() || '';
  if (/^others$/i.test(sub) && sec) return `${sec} · Others`;
  return sub || sec || 'Category';
}
