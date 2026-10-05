import { supabase } from './supabase';
import type { Language, Profile, UserRole } from '../types';
import { nowIsoIst } from './istDateTime';

export interface RemoteUser {
  id: string;
  phone: string;
  display_name: string;
  village: string;
  district: string;
  state: string;
  profile_image_url: string | null;
  skills: string;
  role: string;
  is_active: boolean;
  language: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertUserInput {
  displayName?: string;
  village?: string;
  district?: string;
  state?: string;
  role?: UserRole;
  language?: Language;
  skills?: string[];
}

const VALID_ROLES: UserRole[] = ['farmer', 'laborer', 'business'];

export function normalizePhone(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  if (input.startsWith('+')) {
    return input;
  }
  return cleaned;
}

function nowIso(): string {
  return nowIsoIst();
}

function parseSkills(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function makeUserId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseLanguage(value?: string): Language {
  return value === 'te' ? 'te' : 'en';
}

export function parseUserRole(role?: string): UserRole {
  if (role && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  // Legacy Expo remaps → Android roles
  if (role === 'landowner') return 'farmer';
  if (role === 'both') return 'business';
  return 'farmer';
}

export function toProfile(user: RemoteUser): Profile {
  const skills = parseSkills(user.skills);

  return {
    id: user.id,
    phone: user.phone,
    full_name: user.display_name,
    role: parseUserRole(user.role),
    preferred_language: parseLanguage(user.language),
    skills,
    avatar_url: user.profile_image_url ?? undefined,
    village: user.village || undefined,
    district: user.district || undefined,
    state: user.state || undefined,
    avg_rating: 0,
    total_ratings: 0,
    total_jobs_completed: 0,
    is_verified: false,
    is_active: user.is_active,
    created_at: user.created_at || nowIso(),
  };
}

/** Android getAverageRatingForSeller / getRatingCountForSeller from order_ratings. */
export async function loadUserRatingAggregates(
  userName: string,
  userId?: string | null,
): Promise<{ avg: number; count: number }> {
  const trimmed = userName.trim();
  if (!trimmed && !userId) return { avg: 0, count: 0 };

  let query = supabase.from('order_ratings').select('rating,reviewee_name,reviewee_id');
  if (userId) {
    query = query.or(`reviewee_id.eq.${userId},reviewee_name.eq.${trimmed}`);
  } else {
    query = query.eq('reviewee_name', trimmed);
  }

  const { data, error } = await query;
  if (error || !data) return { avg: 0, count: 0 };

  const valid = (data as { rating: number }[]).filter((r) => Number(r.rating) > 0);
  if (!valid.length) return { avg: 0, count: 0 };
  const sum = valid.reduce((acc, r) => acc + Number(r.rating), 0);
  return { avg: Math.round((sum / valid.length) * 10) / 10, count: valid.length };
}

export async function toProfileWithRatings(user: RemoteUser): Promise<Profile> {
  const profile = toProfile(user);
  const { avg, count } = await loadUserRatingAggregates(user.display_name, user.id);
  return { ...profile, avg_rating: avg, total_ratings: count };
}

export async function getUserByPhone(phone: string): Promise<RemoteUser | null> {
  const normalized = normalizePhone(phone);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', normalized)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as RemoteUser | null;
}

export async function signInWithPhonePassword(phone: string, password: string): Promise<RemoteUser> {
  const user = await getUserByPhone(phone);
  if (!user) {
    throw new Error('No account found for this phone number.');
  }
  if (user.password !== password) {
    throw new Error('Incorrect password.');
  }
  return user;
}

export async function signUpWithPhonePassword(params: {
  phone: string;
  name: string;
  password: string;
  language: Language;
}): Promise<RemoteUser> {
  const existing = await getUserByPhone(params.phone);
  if (existing) {
    throw new Error('An account already exists for this phone number.');
  }

  const payload: RemoteUser = {
    id: makeUserId(),
    phone: normalizePhone(params.phone),
    display_name: params.name.trim(),
    village: '',
    district: '',
    state: '',
    profile_image_url: null,
    skills: '',
    role: 'farmer',
    is_active: true,
    language: params.language,
    password: params.password,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as RemoteUser;
}

export async function updateUserProfile(userId: string, input: UpsertUserInput): Promise<RemoteUser> {
  const payload: Partial<RemoteUser> = {
    updated_at: nowIso(),
  };

  if (input.displayName !== undefined) payload.display_name = input.displayName.trim();
  if (input.village !== undefined) payload.village = input.village.trim();
  if (input.district !== undefined) payload.district = input.district.trim();
  if (input.state !== undefined) payload.state = input.state.trim();
  if (input.role !== undefined) payload.role = input.role;
  if (input.language !== undefined) payload.language = input.language;
  if (input.skills !== undefined) payload.skills = input.skills.join(', ');

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as RemoteUser;
}

export async function getUserById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProfile(data as RemoteUser) : null;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
  openOrderCount?: number;
  netBalance?: number;
}

/** Calls Supabase RPC `delete_user_account` (same as native Android). */
export async function deleteUserAccount(
  userId: string,
  password: string,
): Promise<DeleteAccountResult> {
  const { data, error } = await supabase.rpc('delete_user_account', {
    p_user_id: userId,
    p_password: password,
  });

  if (error) {
    return { success: false, error: error.message || 'rpc_failed' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') {
    return { success: false, error: 'unknown' };
  }

  return {
    success: Boolean((row as DeleteAccountResult).success),
    error: (row as DeleteAccountResult).error,
    openOrderCount: (row as DeleteAccountResult).openOrderCount,
    netBalance: (row as DeleteAccountResult).netBalance,
  };
}
