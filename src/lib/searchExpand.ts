/**
 * Offline search synonym expansion — mirrors Android SearchSynonymMap.
 * Optionally merges AI terms from the /api/search-expand route.
 */

import { apiUrl } from './api';

const CATEGORY_ALIASES: Record<string, string[]> = {
  vehicles: ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  vehicle: ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  'వాహనాలు': ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  gaadi: ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  'గాడి': ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  automobile: ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],
  ride: ['trucks', 'cars', 'bikes', 'auto rickshaws', 'transport'],

  dairy: ['milk', 'paneer', 'curd', 'butter', 'ghee', 'cheese', 'yogurt'],
  'dairy products': ['milk', 'paneer', 'curd', 'butter', 'ghee', 'cheese'],
  'పాల ఉత్పత్తులు': ['milk', 'paneer', 'curd', 'butter', 'ghee'],

  groceries: ['fruits', 'vegetables', 'grains', 'meat', 'dairy', 'eggs', 'spices', 'sugars', 'oils'],
  grocery: ['fruits', 'vegetables', 'grains', 'meat', 'dairy', 'eggs', 'spices', 'sugars', 'oils'],
  food: ['fruits', 'vegetables', 'grains', 'meat', 'dairy', 'eggs', 'spices', 'sugars', 'oils'],
  aahar: ['fruits', 'vegetables', 'grains', 'meat', 'dairy', 'eggs', 'spices', 'sugars', 'oils'],
  'ఆహారం': ['fruits', 'vegetables', 'grains', 'meat', 'dairy', 'eggs', 'spices', 'sugars', 'oils'],

  machinery: ['tractor', 'harvester', 'thresher', 'drone', 'stone picker', 'bore wells'],
  'farm equipment': ['tractor', 'harvester', 'thresher', 'drone', 'stone picker'],
  'farm machinery': ['tractor', 'harvester', 'thresher', 'drone', 'stone picker'],
  'యంత్రాలు': ['tractor', 'harvester', 'thresher', 'drone'],

  workers: ['farm workers', 'construction workers', 'equipment operators', 'cooks', 'hamali', 'electrician', 'plumbing', 'general'],
  labor: ['farm workers', 'construction workers', 'equipment operators', 'cooks', 'hamali', 'electrician'],
  labour: ['farm workers', 'construction workers', 'equipment operators', 'cooks', 'hamali', 'electrician'],
  'కార్మికులు': ['farm workers', 'construction workers', 'equipment operators'],
  'కూలీలు': ['farm workers', 'construction workers', 'equipment operators'],

  'farm inputs': ['fertilizers', 'pesticides', 'seeds', 'saplings'],
  'ఎరువులు': ['fertilizers', 'pesticides', 'seeds'],
  'agriculture supplies': ['fertilizers', 'pesticides', 'seeds'],

  livestock: ['cattle', 'poultry', 'animal feed', 'mobile grazing'],
  animals: ['cattle', 'poultry', 'animal feed'],
  'పశువులు': ['cattle', 'poultry', 'animal feed'],

  events: ['wedding', 'tent house', 'catering'],
  celebrations: ['wedding', 'tent house', 'catering'],
  functions: ['wedding', 'tent house', 'catering'],
  'పెళ్లి': ['wedding', 'tent house', 'catering'],

  property: ['land', 'lease', 'sale', 'plot', 'commercial', 'warehouse', 'farm house'],
  land: ['property', 'agricultural', 'plot', 'lease', 'sale'],
  'ఆస్తి': ['property', 'land', 'plot', 'lease', 'sale'],
  'భూమి': ['land', 'property', 'agricultural', 'lease', 'sale'],
  plot: ['land', 'property', 'residential'],
  'స్థలం': ['land', 'property', 'residential', 'plot'],
};

const PRODUCT_SYNONYMS: Record<string, string[]> = {
  'cottage cheese': ['paneer', 'cheese', 'dairy'],
  paneer: ['cottage cheese', 'cheese', 'dairy'],
  'పనీర్': ['paneer', 'cottage cheese', 'dairy'],
  curd: ['yogurt', 'dahi', 'dairy'],
  dahi: ['curd', 'yogurt', 'dairy'],
  'పెరుగు': ['curd', 'yogurt', 'dairy'],
  ghee: ['clarified butter', 'నెయ్యి', 'dairy'],
  'నెయ్యి': ['ghee', 'butter', 'dairy'],
  butter: ['వెన్న', 'ghee', 'dairy'],

  rice: ['బియ్యం', 'chawal', 'grains'],
  'బియ్యం': ['rice', 'chawal', 'grains'],
  wheat: ['గోధుమలు', 'gehu', 'grains', 'atta'],
  'గోధుమలు': ['wheat', 'grains'],
  millets: ['ragi', 'jowar', 'bajra', 'చిరుధాన్యాలు'],
  pulses: ['dal', 'lentils', 'pappu', 'పప్పు'],
  dal: ['pulses', 'lentils', 'pappu'],
  jaggery: ['gur', 'బెల్లం', 'sugars'],
  'బెల్లం': ['jaggery', 'gur', 'sugars'],
  sugar: ['sugars', 'white sugar', 'brown sugar', 'jaggery'],
  sugars: ['sugar', 'jaggery', 'gur', 'palm sugar'],
  oil: ['oils', 'cooking oil', 'edible oil', 'groundnut oil', 'sunflower oil'],
  oils: ['oil', 'cooking oil', 'groundnut oil', 'coconut oil', 'mustard oil'],
  'నూనె': ['oil', 'oils', 'cooking oil'],
  'cooking oil': ['oil', 'oils', 'groundnut oil', 'sunflower oil'],

  apple: ['aaple', 'apples', 'fruits'],
  mango: ['mangoes', 'aam', 'మామిడి', 'fruits'],
  'మామిడి': ['mango', 'mangoes', 'fruits'],
  banana: ['bananas', 'అరటిపండు', 'kela', 'fruits'],
  'అరటిపండు': ['banana', 'bananas', 'fruits'],

  tomato: ['tomatoes', 'టమాటా', 'vegetables'],
  onion: ['onions', 'ఉల్లిపాయ', 'vegetables'],
  potato: ['potatoes', 'ఆలూ', 'బంగాళదుంప', 'vegetables'],

  chicken: ['కోడి', 'murgi', 'meat'],
  mutton: ['మటన్', 'goat meat', 'meat'],
  fish: ['చేపలు', 'machhi', 'meat'],

  tractor: ['ట్రాక్టర్', 'farm equipment'],
  harvester: ['కోత యంత్రం', 'farm equipment'],
  thresher: ['thrashing machine', 'farm equipment'],
  drone: ['drone operations', 'డ్రోన్', 'farm equipment'],
  borewell: [
    'bore wells', 'borewells', 'బోర్‌వెల్', 'farm equipment',
    '4.5 inch borewell', '6.5 inch borewell', 'side borewell',
    'deep borewell', 'shallow borewell',
  ],
  'bore well': [
    'borewells', 'borewell', 'farm equipment',
    '4.5 inch', '6.5 inch', 'side borewell',
  ],
  '4.5 inch': ['4.5 inch borewell', 'borewell', 'borewells'],
  '6.5 inch': ['6.5 inch borewell', 'borewell', 'borewells'],
  'side borewell': ['side bore well', 'borewell', 'borewells'],
  'deep borewell': ['6.5 inch borewell', 'borewell', 'borewells'],
  'shallow borewell': ['4.5 inch borewell', 'borewell', 'borewells'],

  truck: ['trucks', 'lorry', 'లారీ', 'transport'],
  lorry: ['truck', 'trucks', 'transport'],
  car: ['cars', 'కారు', 'transport'],
  bike: ['bikes', 'motorcycle', 'బైక్', 'transport'],
  auto: ['auto rickshaws', 'ఆటో', 'transport'],
  'auto rickshaw': ['auto rickshaws', 'auto', 'ఆటో'],

  urea: ['fertilizers', 'fertilizer', 'nitrogen'],
  dap: ['fertilizers', 'fertilizer', 'phosphate'],
  npk: ['fertilizers', 'fertilizer'],

  insecticide: ['pesticides', 'pesticide'],
  fungicide: ['pesticides', 'pesticide'],
  herbicide: ['pesticides', 'weedicide'],
  weedicide: ['herbicide', 'pesticides'],

  cook: ['cooks', 'వంటవాడు'],
  plumber: ['plumbing', 'ప్లంబర్'],
  electrician: ['electrical', 'ఎలక్ట్రీషియన్'],
  hamali: ['loading', 'unloading', 'హమాలీ'],
  driver: ['equipment operators', 'transport'],
};

const MISSPELLINGS: Record<string, string> = {
  veehicles: 'vehicles',
  vehicals: 'vehicles',
  vehicels: 'vehicles',
  tracktor: 'tractor',
  tracter: 'tractor',
  fertlizer: 'fertilizers',
  fertlizers: 'fertilizers',
  pestisides: 'pesticides',
  pestiside: 'pesticides',
  panneer: 'paneer',
  panner: 'paneer',
  groseries: 'groceries',
  grosery: 'groceries',
  vegitables: 'vegetables',
  tomates: 'tomato',
  potatos: 'potato',
  chiken: 'chicken',
  muttan: 'mutton',
  harvestor: 'harvester',
  thrasher: 'thresher',
};

/** Offline synonym expansion (Android SearchSynonymMap.expandQuery). */
export function expandQueryLocal(rawQuery: string): string[] {
  const query = rawQuery.toLowerCase().trim();
  if (query.length < 2) return query ? [query] : [];

  const expanded = new Set<string>([query]);
  const corrected = MISSPELLINGS[query] ?? query;
  expanded.add(corrected);

  CATEGORY_ALIASES[corrected]?.forEach((t) => expanded.add(t));
  CATEGORY_ALIASES[query]?.forEach((t) => expanded.add(t));
  PRODUCT_SYNONYMS[corrected]?.forEach((t) => expanded.add(t));
  PRODUCT_SYNONYMS[query]?.forEach((t) => expanded.add(t));

  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  for (const word of words) {
    const wordCorrected = MISSPELLINGS[word] ?? word;
    CATEGORY_ALIASES[wordCorrected]?.forEach((t) => expanded.add(t));
    PRODUCT_SYNONYMS[wordCorrected]?.forEach((t) => expanded.add(t));
  }

  let singularQuery = corrected;
  if (corrected.endsWith('es')) singularQuery = corrected.slice(0, -2);
  else if (corrected.endsWith('s')) singularQuery = corrected.slice(0, -1);
  if (singularQuery !== corrected) {
    CATEGORY_ALIASES[singularQuery]?.forEach((t) => expanded.add(t));
    PRODUCT_SYNONYMS[singularQuery]?.forEach((t) => expanded.add(t));
    expanded.add(singularQuery);
  }

  return Array.from(expanded);
}

/** Calls search-expand edge function; falls back to local synonyms on failure. */
export async function expandQuery(
  query: string,
  language: string = 'en',
): Promise<string[]> {
  const local = expandQueryLocal(query);
  if (query.trim().length < 2) return local;

  try {
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
    const res = await fetch(apiUrl('/search-expand'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(anon ? { Authorization: `Bearer ${anon}` } : {}),
      },
      body: JSON.stringify({ query, language }),
    });
    if (!res.ok) return local;
    const json = await res.json().catch(() => ({}));
    const aiTerms: string[] = Array.isArray(json.expanded_terms)
      ? json.expanded_terms.filter((t: unknown) => typeof t === 'string')
      : Array.isArray(json.terms)
        ? json.terms.filter((t: unknown) => typeof t === 'string')
        : Array.isArray(json.expanded)
          ? json.expanded.filter((t: unknown) => typeof t === 'string')
          : [];
    return Array.from(new Set([...local, ...aiTerms.map((t) => t.toLowerCase())]));
  } catch {
    return local;
  }
}
