import type { PlatformFeeRow } from './finance';
import { supabase } from './supabase';

export const SEVERE_RESTRICTION_THRESHOLD = -2000;

export type WalletRestrictionLevel = 'none' | 'restricted' | 'severe';

export interface WalletStatus {
  level: WalletRestrictionLevel;
  netBalance: number;
  isRestricted: boolean;
  isSeverelyRestricted: boolean;
  message: string | null;
}

interface PaymentDetailRow {
  amount: number;
  status: string;
  payment_type?: string;
  verified_by_admin?: boolean;
  created_at: string | null;
  buyer_name: string;
  seller_name: string;
  buyer_id?: string | null;
  seller_id?: string | null;
}

interface BalanceEvent {
  timestamp: string;
  delta: number;
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `fee-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function computeNetBalance(
  fees: PlatformFeeRow[],
  payments: PaymentDetailRow[],
): number {
  const verifiedPayments = payments.filter(
    (p) => p.payment_type === 'fee_payment' && (p.status === 'completed' || p.verified_by_admin),
  );
  const totalIncurred = fees.reduce((sum, f) => sum + (Number(f.fee_amount) || 0), 0);
  const totalVerifiedPaid = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return totalVerifiedPaid - totalIncurred;
}

export function computeWalletRestricted(
  fees: PlatformFeeRow[],
  payments: PaymentDetailRow[],
): boolean {
  const verifiedPayments = payments.filter(
    (p) => p.payment_type === 'fee_payment' && (p.status === 'completed' || p.verified_by_admin),
  );
  const totalIncurred = fees.reduce((sum, f) => sum + (Number(f.fee_amount) || 0), 0);
  const totalVerifiedPaid = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const netBalance = totalVerifiedPaid - totalIncurred;

  if (netBalance >= 0) return false;

  const events: BalanceEvent[] = [
    ...fees.map((fee) => ({
      timestamp: fee.created_at ?? '',
      delta: -(Number(fee.fee_amount) || 0),
    })),
    ...verifiedPayments.map((payment) => ({
      timestamp: payment.created_at ?? '',
      delta: Number(payment.amount) || 0,
    })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  let running = 0;
  let streakStartTimestamp: string | null = null;

  for (const event of events) {
    const prev = running;
    running += event.delta;
    if (running < 0 && prev >= 0) {
      streakStartTimestamp = event.timestamp;
    } else if (running >= 0 && prev < 0) {
      streakStartTimestamp = null;
    }
  }

  const unpaidInStreak = streakStartTimestamp == null
    ? fees.filter((f) => f.fee_status === 'unpaid').length
    : fees.filter(
      (fee) => fee.fee_status === 'unpaid' && (fee.created_at ?? '') >= streakStartTimestamp!,
    ).length;

  return unpaidInStreak >= 3;
}

export function computeWalletSeverelyRestricted(
  fees: PlatformFeeRow[],
  payments: PaymentDetailRow[],
): boolean {
  return computeNetBalance(fees, payments) < SEVERE_RESTRICTION_THRESHOLD;
}

async function fetchFeesAndPayments(userName: string, userId?: string | null): Promise<{
  fees: PlatformFeeRow[];
  payments: PaymentDetailRow[];
}> {
  const trimmed = userName.trim();
  if (!trimmed) return { fees: [], payments: [] };

  let feeQuery = supabase.from('platform_fees').select('*');
  if (userId) {
    feeQuery = feeQuery.or(`seller_id.eq.${userId},seller_name.eq.${trimmed}`);
  } else {
    feeQuery = feeQuery.eq('seller_name', trimmed);
  }
  const { data: feeRows, error: feeError } = await feeQuery;
  if (feeError) throw feeError;

  const { data: paymentRows, error: paymentError } = await supabase
    .from('payment_details')
    .select('*')
    .or(`buyer_name.eq.${trimmed},seller_name.eq.${trimmed}`);
  if (paymentError) throw paymentError;

  return {
    fees: (feeRows ?? []) as PlatformFeeRow[],
    payments: (paymentRows ?? []) as PaymentDetailRow[],
  };
}

export async function getWalletStatus(
  userName: string,
  userId?: string | null,
): Promise<WalletStatus> {
  try {
    const { fees, payments } = await fetchFeesAndPayments(userName, userId);
    const netBalance = computeNetBalance(fees, payments);
    const severe = computeWalletSeverelyRestricted(fees, payments);
    const restricted = severe || computeWalletRestricted(fees, payments);

    if (severe) {
      return {
        level: 'severe',
        netBalance,
        isRestricted: true,
        isSeverelyRestricted: true,
        message:
          'Your platform fee balance is below -₹2,000. Your listings are hidden and you cannot post or buy until you clear your dues.',
      };
    }
    if (restricted) {
      return {
        level: 'restricted',
        netBalance,
        isRestricted: true,
        isSeverelyRestricted: false,
        message:
          'Your platform fee balance is negative with pending fees. Please clear your dues before posting or buying.',
      };
    }
    return {
      level: 'none',
      netBalance,
      isRestricted: false,
      isSeverelyRestricted: false,
      message: null,
    };
  } catch {
    return {
      level: 'none',
      netBalance: 0,
      isRestricted: false,
      isSeverelyRestricted: false,
      message: null,
    };
  }
}

export async function isWalletRestricted(
  userName: string,
  userId?: string | null,
): Promise<boolean> {
  const status = await getWalletStatus(userName, userId);
  return status.isRestricted;
}

export async function syncRestrictedSellers(): Promise<Set<string>> {
  const restricted = new Set<string>();
  try {
    const { data: allFees, error: feeError } = await supabase
      .from('platform_fees')
      .select('*');
    if (feeError) throw feeError;

    const { data: feePayments, error: payError } = await supabase
      .from('payment_details')
      .select('*')
      .eq('payment_type', 'fee_payment');
    if (payError) throw payError;

    const fees = (allFees ?? []) as PlatformFeeRow[];
    const payments = (feePayments ?? []) as PaymentDetailRow[];

    const sellerGroups = new Map<string, PlatformFeeRow[]>();
    for (const fee of fees) {
      const key = fee.seller_id?.trim() || fee.seller_name;
      if (!key) continue;
      const list = sellerGroups.get(key) ?? [];
      list.push(fee);
      sellerGroups.set(key, list);
    }

    for (const [, sellerFees] of sellerGroups) {
      const sellerPayments = payments.filter(
        (p) =>
          sellerFees.some((f) => f.seller_name === p.buyer_name || f.seller_id === p.buyer_id),
      );
      if (computeWalletSeverelyRestricted(sellerFees, sellerPayments)) {
        for (const fee of sellerFees) {
          if (fee.seller_id?.trim()) restricted.add(fee.seller_id.trim());
          if (fee.seller_name?.trim()) restricted.add(fee.seller_name.trim());
        }
      }
    }
  } catch {
    // Fail open
  }
  return restricted;
}

export function isSellerRestricted(
  restricted: Set<string>,
  sellerName?: string | null,
  sellerId?: string | null,
): boolean {
  if (sellerId && restricted.has(sellerId)) return true;
  if (sellerName && restricted.has(sellerName)) return true;
  return false;
}

export async function checkAndBlockWalletRestricted(
  userName: string,
  userId: string | null | undefined,
  onNavigateToPayments?: () => void,
): Promise<boolean> {
  const status = await getWalletStatus(userName, userId);
  if (!status.isRestricted) return false;

  const go = window.confirm(
    `${status.message ?? 'Please clear your dues before continuing.'}\n\nOpen Platform Fee?`,
  );
  if (go) onNavigateToPayments?.();
  return true;
}

export function walletBannerText(status: WalletStatus): string | null {
  if (status.level === 'severe') {
    return '🚫 Your platform fee balance is below -₹2,000. Your listings are hidden and all actions are blocked until you clear your dues.';
  }
  if (status.level === 'restricted') {
    return '⚠️ Your platform fee balance is negative. Please clear your dues to continue posting or buying.';
  }
  return null;
}

export function makeLocalFeeId(): string {
  return uuid();
}
