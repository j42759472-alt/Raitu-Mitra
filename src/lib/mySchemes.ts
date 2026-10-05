export type AppliedSchemeRow = {
  name: string;
  category: string;
  status: string;
  date: string;
};

const APPLIED_SCHEMES_KEY = 'applied_schemes';

function encodeSchemeString(row: AppliedSchemeRow): string {
  return `${row.name}|${row.category}|${row.status}|${row.date}`;
}

function decodeSchemeString(s: string): AppliedSchemeRow | null {
  const parts = s.split('|');
  if (parts.length < 4) return null;
  return { name: parts[0], category: parts[1], status: parts[2], date: parts[3] };
}

function formatNowDdMmmYyyy(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d);
  const year = String(d.getFullYear());
  return `${day} ${month} ${year}`;
}

export async function loadAppliedSchemes(): Promise<AppliedSchemeRow[]> {
  try {
    const raw = localStorage.getItem(APPLIED_SCHEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => (typeof x === 'string' ? decodeSchemeString(x) : null))
      .filter(Boolean) as AppliedSchemeRow[];
  } catch {
    return [];
  }
}

export async function saveSchemeApplication(params: {
  name: string;
  category: string;
}): Promise<void> {
  const status = 'Applied';
  const date = formatNowDdMmmYyyy();

  try {
    const existing = await loadAppliedSchemes();
    const already = existing.some((row) => row.name === params.name);
    if (!already) {
      const next = [...existing, { name: params.name, category: params.category, status, date }];
      localStorage.setItem(
        APPLIED_SCHEMES_KEY,
        JSON.stringify(next.map(encodeSchemeString)),
      );
    }
  } catch {
    // Fail soft
  }
}
