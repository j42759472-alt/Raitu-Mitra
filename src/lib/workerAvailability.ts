import { supabase } from './supabase';

/** Parse `Date: YYYY-MM-DD …` / `End: YYYY-MM-DD …` from worker description (Android ProductUtils). */
export function parseWorkerAvailabilityDateRange(
  description: string,
): { start: string; end: string } | null {
  const lines = description.split(/\r?\n/);
  const dateRaw = (() => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith('date:'));
    return line ? line.replace(/^date:\s*/i, '').trim() : '';
  })();
  if (!dateRaw) return null;

  const endRaw = (() => {
    const line = lines.find((l) => l.trim().toLowerCase().startsWith('end:'));
    return line ? line.replace(/^end:\s*/i, '').trim() : '';
  })();

  const start = dateRaw.split(/\s+/)[0] ?? '';
  const end = (endRaw.split(/\s+/)[0] || start);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start;
  return { start, end: endDate };
}

/** Display string for registered availability window. */
export function formatAvailabilityWindow(description: string): { dates: string; timings: string } {
  const range = parseWorkerAvailabilityDateRange(description);
  const lines = description.split(/\r?\n/);
  const dateRaw = lines.find((l) => l.trim().toLowerCase().startsWith('date:'))?.replace(/^date:\s*/i, '').trim() ?? '';
  const endRaw = lines.find((l) => l.trim().toLowerCase().startsWith('end:'))?.replace(/^end:\s*/i, '').trim() ?? '';
  const startTime = dateRaw.split(/\s+/).slice(1).join(' ');
  const endTime = endRaw.split(/\s+/).slice(1).join(' ');
  const timings = [startTime, endTime].filter(Boolean).join(' → ');
  if (!range) return { dates: '', timings };
  const dates = range.start === range.end ? range.start : `${range.start} → ${range.end}`;
  return { dates, timings };
}

/** Inclusive day count between YYYY-MM-DD strings. */
export function inclusiveDayCount(startYmd: string, endYmd: string): number {
  const a = parseYmd(startYmd);
  const b = parseYmd(endYmd);
  if (!a || !b || b < a) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
}

export function parseYmd(ymd: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const t = Date.UTC(y!, m! - 1, d!);
  return Number.isFinite(t) ? t : null;
}

/** Today in IST as YYYY-MM-DD. */
export function todayYmdIst(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Clamp booking range to [max(today, regStart), regEnd]. Returns null if none left. */
export function clampBookableRange(
  regStart: string,
  regEnd: string,
): { min: string; max: string } | null {
  const today = todayYmdIst();
  const min = regStart > today ? regStart : today;
  if (min > regEnd) return null;
  return { min, max: regEnd };
}

export type WorkerAvailabilityResult = {
  minAvailable: number;
  bottleneckDate: string | null;
};

/**
 * Android RaituRepository.getAvailableWorkerSlotsForDateRange — calls
 * Supabase RPC `check_worker_availability`.
 */
export async function checkWorkerAvailability(params: {
  workerId: string;
  fallbackCapacity: number;
  startDate: string;
  endDate: string;
  excludeOrderId?: string;
}): Promise<WorkerAvailabilityResult> {
  const capacityHint = Math.max(1, params.fallbackCapacity);
  const body: Record<string, unknown> = {
    target_worker_id: params.workerId,
    req_start: params.startDate,
    req_end: params.endDate,
    fallback_capacity: capacityHint,
  };
  if (params.excludeOrderId) body.exclude_order_id = params.excludeOrderId;

  const { data, error } = await supabase.rpc('check_worker_availability', body);
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    return { minAvailable: capacityHint, bottleneckDate: null };
  }
  const rec = row as Record<string, unknown>;
  const minAvailable = Number(rec.min_available ?? rec.minAvailable ?? capacityHint);
  const bottleneckDate = (rec.bottleneck_date ?? rec.bottleneckDate ?? null) as string | null;
  return {
    minAvailable: Number.isFinite(minAvailable) ? Math.max(0, Math.floor(minAvailable)) : 0,
    bottleneckDate: bottleneckDate || null,
  };
}

/** Hire total: workers × daily wage × days (Android OrderConfirmationFragment.setupHireMode). */
export function hireTotalPrice(hireCount: number, dailyWage: number, totalDays: number): number {
  return hireCount * dailyWage * Math.max(1, totalDays);
}
