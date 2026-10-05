import { supabase } from './supabase';
import { startOfDayIsoIst } from './istDateTime';

export interface FeedbackItem {
  id: string;
  user_id: string;
  user_name: string;
  feedback_text: string;
  created_at?: string | null;
}

const DAILY_LIMIT = 5;
const HISTORY_LIMIT = 5;

export async function listFeedback(userId: string): Promise<FeedbackItem[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  const rows = (data ?? []) as FeedbackItem[];
  return [...rows].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return ta - tb;
  });
}

export async function sendFeedback(params: {
  userId: string;
  userName: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const todayStart = startOfDayIsoIst();
  const { data: todayRows, error: countError } = await supabase
    .from('feedback')
    .select('id')
    .eq('user_id', params.userId)
    .gte('created_at', todayStart);

  if (countError) return { ok: false, error: countError.message };
  if ((todayRows ?? []).length >= DAILY_LIMIT) {
    return { ok: false, error: 'Daily limit reached: Maximum 5 feedback messages per day.' };
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: params.userId,
    user_name: params.userName,
    feedback_text: params.text,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  return !error;
}
