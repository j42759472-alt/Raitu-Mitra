/** App-wide IST (Asia/Kolkata) date/time helpers for the Expo/RN side. */

export const IST_TIME_ZONE = 'Asia/Kolkata';

const IST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function istParts(date: Date = new Date()): Record<string, string> {
  const parts = IST_FORMATTER.formatToParts(date);
  const out: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') out[part.type] = part.value;
  }
  return out;
}

/** Current timestamp in IST with offset, e.g. `2026-08-03T17:16:00+05:30`. */
export function nowIsoIst(): string {
  const p = istParts();
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+05:30`;
}

/** Start of the current IST calendar day as ISO with offset. */
export function startOfDayIsoIst(now: Date = new Date()): string {
  const p = istParts(now);
  return `${p.year}-${p.month}-${p.day}T00:00:00+05:30`;
}

export function formatIst(dateInput: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    ...options,
  }).format(date);
}

export function isSameIstDay(iso: string | null | undefined, now: Date = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const a = istParts(d);
  const b = istParts(now);
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function isSameIstMonth(iso: string | null | undefined, now: Date = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const a = istParts(d);
  const b = istParts(now);
  return a.year === b.year && a.month === b.month;
}
