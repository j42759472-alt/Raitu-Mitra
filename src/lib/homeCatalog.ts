/** Lucide icon name used by CategoryGrid */
export type HomeIconName = string;

const IMG =
  'https://aqxoevzybnlyneghyxvg.supabase.co/storage/v1/object/public/product-images/public/drawables/';

/** Max tiles shown on the home screen per section (Android MAX_VISIBLE). */
export const HOME_VISIBLE_COUNT = 4;

export type HomeItemRoute =
  | { kind: 'category'; section: string; subcategory?: string }
  | { kind: 'workforce'; workerType?: string }
  | { kind: 'more'; sectionId: string }
  | { kind: 'schemes' }
  | { kind: 'screen'; href: string };

export interface HomeCatalogItem {
  id: string;
  label: string;
  icon: HomeIconName;
  imageUrl?: string;
  route: HomeItemRoute;
}

export interface HomeCatalogSection {
  id: string;
  title: string;
  /** How many items to show on home; overflow via View All. */
  homeVisibleCount?: number;
  viewAllRoute?: HomeItemRoute;
  items: HomeCatalogItem[];
}

export const HOME_SECTIONS: HomeCatalogSection[] = [
  {
    id: 'groceries',
    title: 'Groceries',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'groceries' },
    items: [
      { id: 'fruits', label: 'Fruits', icon: 'nutrition', imageUrl: `${IMG}ic_fruits_photo.png`, route: { kind: 'category', section: 'Groceries', subcategory: 'Fruits' } },
      { id: 'vegetables', label: 'Vegetables', icon: 'leaf', imageUrl: `${IMG}ic_vegetables_photo.png`, route: { kind: 'category', section: 'Groceries', subcategory: 'Vegetables' } },
      { id: 'grains', label: 'Grains', icon: 'basket', imageUrl: `${IMG}ic_grains_photo.jpg`, route: { kind: 'category', section: 'Groceries', subcategory: 'Grains' } },
      { id: 'spices', label: 'Spices', icon: 'flame', imageUrl: `${IMG}ic_spices_photo.png`, route: { kind: 'category', section: 'Groceries', subcategory: 'Spices' } },
      { id: 'meat', label: 'Meat', icon: 'fish', imageUrl: `${IMG}ic_meat_photo.jpg`, route: { kind: 'category', section: 'Groceries', subcategory: 'Meat' } },
      { id: 'dairy', label: 'Dairy', icon: 'water', imageUrl: `${IMG}ic_dairy_photo.png`, route: { kind: 'category', section: 'Groceries', subcategory: 'Dairy' } },
      { id: 'eggs', label: 'Eggs', icon: 'ellipse', imageUrl: `${IMG}ic_eggs_photo.jpg`, route: { kind: 'category', section: 'Groceries', subcategory: 'Eggs' } },
      { id: 'sugars', label: 'Sugars', icon: 'cube', imageUrl: `${IMG}ic_sugars_photo.png`, route: { kind: 'category', section: 'Groceries', subcategory: 'Sugars' } },
      { id: 'oils', label: 'Oils', icon: 'beaker', imageUrl: `${IMG}ic_oils_photo.jpg`, route: { kind: 'category', section: 'Groceries', subcategory: 'Oils' } },
      { id: 'grocery-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Groceries', subcategory: 'Others' } },
    ],
  },
  {
    id: 'farm_inputs',
    title: 'Farm Inputs',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'farm_inputs' },
    items: [
      { id: 'fertilizers', label: 'Fertilizers', icon: 'flask', imageUrl: `${IMG}ic_fertilizers_photo.png`, route: { kind: 'category', section: 'Farm Inputs', subcategory: 'Fertilizers' } },
      { id: 'pesticides', label: 'Pesticides', icon: 'bug', imageUrl: `${IMG}ic_pesticides_photo.png`, route: { kind: 'category', section: 'Farm Inputs', subcategory: 'Pesticides' } },
      { id: 'seeds', label: 'Seeds & Saplings', icon: 'leaf', imageUrl: `${IMG}ic_seeds_saplings_photo.png`, route: { kind: 'category', section: 'Farm Inputs', subcategory: 'Seeds & Saplings' } },
      { id: 'inputs-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Farm Inputs', subcategory: 'Others' } },
    ],
  },
  {
    id: 'farm_equipment',
    title: 'Farm Equipment',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'farm_equipment' },
    items: [
      { id: 'drone', label: 'Drone Ops', icon: 'airplane', imageUrl: `${IMG}ic_drone_operations_photo.jpg`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Drone' } },
      { id: 'thresher', label: 'Thresher', icon: 'cog', imageUrl: `${IMG}ic_thresher_photo.png`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Thresher' } },
      { id: 'harvester', label: 'Harvester', icon: 'construct', imageUrl: `${IMG}ic_harvester_photo.jpg`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Harvester' } },
      { id: 'cultivator', label: 'Cultivator', icon: 'construct', imageUrl: `${IMG}ic_cultivator_photo.png`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Cutivator' } },
      { id: 'tractor', label: 'Tractor', icon: 'car', imageUrl: `${IMG}ic_tractor_photo.jpg`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Tractor' } },
      { id: 'stone-picker', label: 'Stone Picker', icon: 'cube', imageUrl: `${IMG}ic_stone_picker_photo.png`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Stone Picker' } },
      { id: 'manual', label: 'Manual Equipment', icon: 'hammer', imageUrl: `${IMG}ic_manual_equipment_photo.png`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Manual Equipment' } },
      { id: 'borewells', label: 'Borewells', icon: 'water', imageUrl: `${IMG}ic_borewells_photo.jpg`, route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Borewells' } },
      { id: 'equipment-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Farm Equipment', subcategory: 'Others' } },
    ],
  },
  {
    id: 'animal_husbandry',
    title: 'Animal Husbandry',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'animal_husbandry' },
    items: [
      { id: 'grazing', label: 'Mobile Grazing', icon: 'walk', imageUrl: `${IMG}ic_mobile_grazing_photo.jpg`, route: { kind: 'category', section: 'Animal Husbandry', subcategory: 'Mobile Grazing' } },
      { id: 'cattle', label: 'Cattle', icon: 'paw', imageUrl: `${IMG}ic_cattle_photo.jpg`, route: { kind: 'category', section: 'Animal Husbandry', subcategory: 'Cattle' } },
      { id: 'poultry', label: 'Poultry', icon: 'ellipse', imageUrl: `${IMG}ic_poultry_photo.png`, route: { kind: 'category', section: 'Animal Husbandry', subcategory: 'Poultry' } },
      { id: 'feed', label: 'Animal Feed', icon: 'restaurant', imageUrl: `${IMG}ic_animal_feed_photo.png`, route: { kind: 'category', section: 'Animal Husbandry', subcategory: 'Animal Feed' } },
      { id: 'husbandry-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Animal Husbandry', subcategory: 'Others' } },
    ],
  },
  {
    id: 'workforce',
    title: 'Workforce Supply',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'workforce' },
    items: [
      { id: 'farm-workers', label: 'Farm Workers', icon: 'people', imageUrl: `${IMG}ic_farm_workers_photo.png`, route: { kind: 'workforce', workerType: 'Farm Workers' } },
      { id: 'construction', label: 'Construction', icon: 'hammer', imageUrl: `${IMG}ic_construction_workers_photo.png`, route: { kind: 'workforce', workerType: 'Construction Workers' } },
      { id: 'operators', label: 'Operators', icon: 'settings', imageUrl: `${IMG}ic_equipment_operators_photo.png`, route: { kind: 'workforce', workerType: 'Equipment Operators' } },
      { id: 'cooks', label: 'Cooks', icon: 'restaurant', imageUrl: `${IMG}ic_cooks_photo.png`, route: { kind: 'workforce', workerType: 'Cooks' } },
      { id: 'hamali', label: 'Hamali', icon: 'barbell', imageUrl: `${IMG}ic_hamali_photo.jpg`, route: { kind: 'workforce', workerType: 'Hamali' } },
      { id: 'electrician', label: 'Electrician', icon: 'flash', imageUrl: `${IMG}ic_electrician_photo.jpg`, route: { kind: 'workforce', workerType: 'Electrician' } },
      { id: 'plumbing', label: 'Plumbing', icon: 'water', imageUrl: `${IMG}ic_plumbing_photo.jpg`, route: { kind: 'workforce', workerType: 'Plumbing' } },
      { id: 'general', label: 'General', icon: 'person', imageUrl: `${IMG}ic_general_workers_photo.png`, route: { kind: 'workforce', workerType: 'General' } },
    ],
  },
  {
    id: 'events',
    title: 'Events',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'events' },
    items: [
      { id: 'wedding', label: 'Wedding', icon: 'heart', imageUrl: `${IMG}ic_wedding_photo.png`, route: { kind: 'category', section: 'Events', subcategory: 'Wedding' } },
      { id: 'tent', label: 'Tent House', icon: 'home', imageUrl: `${IMG}ic_tent_house_photo.png`, route: { kind: 'category', section: 'Events', subcategory: 'Tent House' } },
      { id: 'catering', label: 'Catering', icon: 'cafe', imageUrl: `${IMG}ic_catering_services_photo.jpg`, route: { kind: 'category', section: 'Events', subcategory: 'Catering' } },
      { id: 'events-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Events', subcategory: 'Others' } },
    ],
  },
  {
    id: 'tertiary',
    title: 'Tertiary',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'tertiary' },
    items: [
      { id: 'warehousing', label: 'Warehousing', icon: 'business', imageUrl: `${IMG}ic_wharehouse_photo.png`, route: { kind: 'category', section: 'Tertiary', subcategory: 'Warehousing' } },
      { id: 'packing', label: 'Packing', icon: 'cube-outline', imageUrl: `${IMG}ic_packing_photo.jpg`, route: { kind: 'category', section: 'Tertiary', subcategory: 'Packing' } },
      { id: 'tertiary-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Tertiary', subcategory: 'Others' } },
    ],
  },
  {
    id: 'transport',
    title: 'Transport',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'transport' },
    items: [
      { id: 'truck', label: 'Trucks', icon: 'bus', imageUrl: `${IMG}ic_trucks_photo.png`, route: { kind: 'category', section: 'Transport', subcategory: 'Trucks' } },
      { id: 'car', label: 'Cars', icon: 'car-sport', imageUrl: `${IMG}ic_cars_photo.jpg`, route: { kind: 'category', section: 'Transport', subcategory: 'Cars' } },
      { id: 'bikes', label: 'Bikes', icon: 'bicycle', imageUrl: `${IMG}ic_bikes_photo.png`, route: { kind: 'category', section: 'Transport', subcategory: 'Bikes' } },
      { id: 'auto', label: 'Auto Rickshaws', icon: 'car', imageUrl: `${IMG}ic_auto_rickshaws_photo.jpg`, route: { kind: 'category', section: 'Transport', subcategory: 'Auto Rickshaws' } },
      { id: 'transport-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Transport', subcategory: 'Others' } },
    ],
  },
  {
    id: 'property',
    title: 'Property Lease / Sale',
    homeVisibleCount: HOME_VISIBLE_COUNT,
    viewAllRoute: { kind: 'more', sectionId: 'property' },
    items: [
      { id: 'agri-land', label: 'Agricultural Land', icon: 'map', imageUrl: `${IMG}ic_agricultural_land_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Agricultural Land' } },
      { id: 'commercial', label: 'Commercial Space', icon: 'storefront', imageUrl: `${IMG}ic_commercial_space_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Commercial Space' } },
      { id: 'farm-house', label: 'Farm House', icon: 'home', imageUrl: `${IMG}ic_farm_house_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Farm House' } },
      { id: 'res-plot', label: 'Residential Plot', icon: 'grid', imageUrl: `${IMG}ic_residential_plot_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Residential Plot' } },
      { id: 'warehouse', label: 'Warehouse / Godown', icon: 'archive', imageUrl: `${IMG}ic_godown_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Warehouse / Godown' } },
      { id: 'apartment', label: 'Apartment / Villa', icon: 'business', imageUrl: `${IMG}ic_villa_photo.png`, route: { kind: 'category', section: 'Property', subcategory: 'Apartment / Villa' } },
      { id: 'property-others', label: 'Others', icon: 'ellipsis-horizontal', route: { kind: 'category', section: 'Property', subcategory: 'Others' } },
    ],
  },
];

export function getHomeSection(sectionId: string): HomeCatalogSection | undefined {
  return HOME_SECTIONS.find((s) => s.id === sectionId);
}

export function homeItemsForSection(section: HomeCatalogSection): HomeCatalogItem[] {
  const count = section.homeVisibleCount ?? HOME_VISIBLE_COUNT;
  return section.items.slice(0, count);
}

/** Map legacy Ionicons names to Lucide icon names */
export function safeIcon(name: string): HomeIconName {
  const map: Record<string, HomeIconName> = {
    nutrition: 'Apple',
    leaf: 'Leaf',
    basket: 'ShoppingBasket',
    flame: 'Flame',
    fish: 'Fish',
    water: 'Droplets',
    ellipse: 'Circle',
    cube: 'Box',
    beaker: 'FlaskConical',
    'ellipsis-horizontal': 'MoreHorizontal',
    flask: 'FlaskConical',
    bug: 'Bug',
    airplane: 'Plane',
    cog: 'Cog',
    construct: 'Wrench',
    car: 'Car',
    hammer: 'Hammer',
    walk: 'Footprints',
    paw: 'PawPrint',
    restaurant: 'UtensilsCrossed',
    people: 'Users',
    settings: 'Settings',
    flash: 'Zap',
    person: 'User',
    heart: 'Heart',
    home: 'Home',
    cafe: 'Coffee',
    business: 'Building2',
    'cube-outline': 'Package',
    bus: 'Bus',
    'car-sport': 'CarFront',
    bicycle: 'Bike',
    map: 'Map',
    storefront: 'Store',
    grid: 'Grid3x3',
    archive: 'Archive',
    seedling: 'Sprout',
    egg: 'Circle',
  };
  return map[name] ?? 'Leaf';
}
