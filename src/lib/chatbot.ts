import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiUrl } from './api';

export interface ChatbotSession {
  id: string;
  user_id: string;
  title: string;
  created_at?: string | null;
  deleted_by_user?: boolean;
}

export interface ChatbotMessage {
  id: string;
  session_id: string;
  content: string;
  is_user: boolean;
  action_type?: string | null;
  suggested_products?: unknown;
  created_at?: string | null;
}

export interface ChatbotResponse {
  reply: string;
  suggestedProducts?: unknown;
  actionType?: string | null;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

function chatbotDb(userId: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: { 'x-user-id': userId },
    },
  });
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

export async function getChatbotSessions(userId: string): Promise<ChatbotSession[]> {
  const db = chatbotDb(userId);
  const { data, error } = await db
    .from('chatbot_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('deleted_by_user', false)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as ChatbotSession[];
}

export async function createChatbotSession(
  userId: string,
  title: string,
  sessionId: string,
): Promise<ChatbotSession | null> {
  const db = chatbotDb(userId);
  const { data, error } = await db
    .from('chatbot_sessions')
    .insert({ id: sessionId, user_id: userId, title })
    .select()
    .maybeSingle();
  if (error) return null;
  return data as ChatbotSession;
}

export async function getChatbotMessages(
  userId: string,
  sessionId: string,
): Promise<ChatbotMessage[]> {
  const db = chatbotDb(userId);
  const { data, error } = await db
    .from('chatbot_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as ChatbotMessage[];
}

export async function softDeleteChatbotSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const db = chatbotDb(userId);
  const { error } = await db
    .from('chatbot_sessions')
    .update({ deleted_by_user: true })
    .eq('id', sessionId);
  return !error;
}

export async function softDeleteAllChatbotSessions(userId: string): Promise<boolean> {
  const db = chatbotDb(userId);
  const { error } = await db
    .from('chatbot_sessions')
    .update({ deleted_by_user: true })
    .eq('user_id', userId);
  return !error;
}

export async function sendChatbotMessage(params: {
  message: string;
  userName: string;
  location?: string | null;
  language: string;
  sessionId: string;
  isNewSession: boolean;
  userId: string;
}): Promise<ChatbotResponse> {
  const { message, userName, location, language, sessionId, isNewSession, userId } = params;
  const db = chatbotDb(userId);

  if (isNewSession) {
    await createChatbotSession(userId, message.slice(0, 30), sessionId);
  }

  const userMsg: ChatbotMessage = {
    id: uuid(),
    session_id: sessionId,
    content: message,
    is_user: true,
  };
  await db.from('chatbot_messages').insert(userMsg);

  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

  try {
    const res = await fetch(apiUrl('/ai-chatbot'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: anon ? `Bearer ${anon}` : '',
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        user_name: userName,
        user_location: location ?? '',
        language,
        session_id: sessionId,
      }),
    });

    const json = await res.json().catch(() => ({}));
    const reply =
      typeof json.reply === 'string' ? json.reply : "Sorry, I couldn't understand that.";
    const actionType = typeof json.action_type === 'string' ? json.action_type : null;
    const suggestedProducts = json.suggested_products ?? null;

    const botMsg: ChatbotMessage = {
      id: uuid(),
      session_id: sessionId,
      content: reply,
      is_user: false,
      action_type: actionType,
      suggested_products: suggestedProducts,
    };
    await db.from('chatbot_messages').insert(botMsg);

    return { reply, suggestedProducts, actionType };
  } catch {
    return {
      reply: 'Something went wrong. Please check your internet connection.',
      suggestedProducts: null,
      actionType: null,
    };
  }
}

export function newSessionId(): string {
  return uuid();
}
