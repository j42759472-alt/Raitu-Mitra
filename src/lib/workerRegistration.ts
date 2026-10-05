/**
 * Android SingleRegistrationFragment / GroupRegistrationFragment skill & category maps.
 */

export const WORKFORCE_SHORT_CATEGORIES = [
  'Farm',
  'Construction',
  'Operator',
  'Cook',
  'Hamali',
  'Electrician',
  'Plumbing',
  'General',
] as const;

export type WorkforceShortCategory = (typeof WORKFORCE_SHORT_CATEGORIES)[number];

export const SUB_CATEGORY_SKILLS: Record<string, string[]> = {
  Fruits: ['Bananas', 'Mangoes', 'Grapes', 'Citrus', 'Pomegranates', 'Guava', 'Papaya'],
  Vegetables: ['Tomato', 'Potato', 'Onion', 'Leafy Greens', 'Chilli', 'Brinjal', 'Okra'],
  Grains: ['Rice', 'Wheat', 'Maize', 'Pulses', 'Millet', 'Sorghum', 'Groundnut'],
  Plantation: ['Coffee', 'Tea', 'Rubber', 'Coconut', 'Areca Nut', 'Black Pepper', 'Cocoa'],
  Livestock: ['Cattle Rearing', 'Milking', 'Poultry Care', 'Goat / Sheep Rearing', 'Fisheries', 'Beekeeping'],
  Masonry: ['Masonry', 'Brick Laying', 'Building Foundation'],
  Carpentry: ['Carpentry'],
  Painting: ['House Painting'],
  'Electrical Works': ['Electrical Works'],
  'Electrical/Plumbing': ['Electrical Works', 'Plumbing'],
  'General Construction': ['Roofing', 'Scaffolding'],
  'Tractor / Rotavator': ['Tractor Operator', 'Rotavator Operator'],
  'Harvesting Machines': ['Harvester Operator'],
  'Irrigation / Pumps': ['Pump Operation'],
  'Other Equipment': ['Seed Drill Operator', 'Sprayer Operator'],
  'Loading / Packing': ['Loading & Unloading', 'Packing'],
  Warehouse: ['Warehouse Helper'],
  Cleaning: ['Cleaning'],
  Security: ['Security / Guarding'],
  Vegetarian: ['Vegetarian Specialist', 'South Indian Meals'],
  'Non-Veg': ['Non-Veg Specialist', 'North Indian Meals'],
  Specialist: ['Snacks & Tiffin', 'Wedding Catering', 'Traditional Sweets'],
};

export const WORKFORCE_SUB_CATEGORIES: Record<WorkforceShortCategory, string[]> = {
  Farm: ['Fruits', 'Vegetables', 'Grains', 'Plantation', 'Livestock'],
  Construction: ['Masonry', 'Carpentry', 'Painting', 'Electrical/Plumbing', 'General Construction'],
  Operator: ['Tractor / Rotavator', 'Harvesting Machines', 'Irrigation / Pumps', 'Other Equipment'],
  Cook: ['Vegetarian', 'Non-Veg', 'Specialist'],
  Hamali: ['Loading / Packing'],
  Electrician: ['Electrical Works'],
  Plumbing: ['Electrical/Plumbing'],
  General: ['Loading / Packing', 'Warehouse', 'Cleaning', 'Security'],
};

export const FARM_SKILLS = [
  'Ploughing & Tilling', 'Land Leveling', 'Sowing', 'Transplanting', 'Planting',
  'Weeding', 'Fertilizing', 'Pesticide Spraying', 'Irrigation Management',
  'Drip Irrigation Setup', 'Mulching', 'Pruning', 'Intercropping',
  'Harvesting', 'Threshing', 'Winnowing', 'Cattle Rearing', 'Milking',
];

export const CONSTRUCTION_SKILLS = [
  'Masonry', 'Carpentry', 'House Painting', 'Electrical Works', 'Plumbing',
  'Building Foundation', 'Brick Laying', 'Roofing', 'Scaffolding',
];

export const EQUIPMENT_SKILLS = [
  'Tractor Operator', 'Harvester Operator', 'Rotavator Operator',
  'Seed Drill Operator', 'Sprayer Operator', 'Pump Operation',
];

export const GENERAL_SKILLS = [
  'Loading & Unloading', 'Warehouse Helper', 'Cleaning', 'Security / Guarding',
  'Packing', 'Sorting & Grading', 'Drying & Curing',
];

export const COOK_SKILLS = [
  'South Indian Meals', 'North Indian Meals', 'Snacks & Tiffin',
  'Wedding Catering', 'Traditional Sweets', 'Vegetarian Specialist', 'Non-Veg Specialist',
];

/** Android normalizeWorkerCategory */
export function normalizeWorkerCategory(raw: string): WorkforceShortCategory {
  const normalized = raw.trim();
  if (!normalized || /^all$/i.test(normalized)) return 'General';
  if (/farm/i.test(normalized)) return 'Farm';
  if (/construction/i.test(normalized)) return 'Construction';
  if (/operator/i.test(normalized)) return 'Operator';
  if (/cook/i.test(normalized)) return 'Cook';
  if (/hamali/i.test(normalized)) return 'Hamali';
  if (/electrician/i.test(normalized)) return 'Electrician';
  if (/plumbing/i.test(normalized)) return 'Plumbing';
  if (/general/i.test(normalized)) return 'General';
  return (WORKFORCE_SHORT_CATEGORIES as readonly string[]).includes(normalized)
    ? (normalized as WorkforceShortCategory)
    : 'General';
}

/** Mid segment written to products.category (`Workers|Farm Workers|…`). */
export function registrationCategoryLabel(short: WorkforceShortCategory): string {
  switch (short) {
    case 'Farm': return 'Farm Workers';
    case 'Construction': return 'Construction Workers';
    case 'Operator': return 'Equipment Operators';
    case 'Cook': return 'Cooks';
    case 'Hamali': return 'Hamali';
    case 'Electrician': return 'Electrician';
    case 'Plumbing': return 'Plumbing';
    default: return 'General';
  }
}

export function defaultSkillsForCategory(category: WorkforceShortCategory): string[] {
  switch (category) {
    case 'Farm': return FARM_SKILLS;
    case 'Construction': return CONSTRUCTION_SKILLS;
    case 'Operator': return EQUIPMENT_SKILLS;
    case 'Cook': return COOK_SKILLS;
    case 'Hamali':
    case 'Electrician':
    case 'Plumbing':
    case 'General':
    default:
      return GENERAL_SKILLS;
  }
}

/** Skills shown for the current subcategory selection (Android populateSkills). */
export function skillsForSubCategory(
  category: WorkforceShortCategory,
  subCategory: string | null,
): string[] {
  if (subCategory && SUB_CATEGORY_SKILLS[subCategory]) {
    return SUB_CATEGORY_SKILLS[subCategory]!;
  }
  return defaultSkillsForCategory(category);
}

/**
 * Android determineCategoryAndSubCategory — keep top-level category fixed;
 * use selected sub when valid, else "All".
 */
export function resolveRegistrationCategory(
  shortCategory: WorkforceShortCategory,
  selectedSub: string | null,
): { categoryName: string; subCategoryName: string } {
  const categoryName = registrationCategoryLabel(shortCategory);
  const available = WORKFORCE_SUB_CATEGORIES[shortCategory] ?? [];
  if (
    selectedSub
    && selectedSub !== 'All'
    && available.includes(selectedSub)
  ) {
    return { categoryName, subCategoryName: selectedSub };
  }
  return { categoryName, subCategoryName: 'All' };
}

/** Parse "hh:mm a" loosely for start/end time ordering. */
export function parseAmPmTime(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]!.toUpperCase();
  if (!Number.isFinite(h) || !Number.isFinite(min) || min < 0 || min > 59 || h < 1 || h > 12) {
    return null;
  }
  if (ap === 'AM') {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return h * 60 + min;
}

export function isStartTimeAfterEndTime(startTime: string, endTime: string): boolean {
  const a = parseAmPmTime(startTime);
  const b = parseAmPmTime(endTime);
  if (a == null || b == null) return false;
  return a > b;
}
