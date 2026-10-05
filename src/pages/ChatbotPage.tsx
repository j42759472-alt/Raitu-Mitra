import { useEffect, useRef, useState } from 'react';
import { Trash2, Send } from 'lucide-react';
import {
  getChatbotMessages,
  getChatbotSessions,
  newSessionId,
  sendChatbotMessage,
  softDeleteAllChatbotSessions,
  softDeleteChatbotSession,
  type ChatbotMessage,
  type ChatbotSession,
} from '@/lib/chatbot';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';

export default function ChatbotPage() {
  const user = useStore((s) => s.user);
  const language = useStore((s) => s.language);
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => newSessionId());
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    getChatbotSessions(user.id).then(setSessions);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !sessionId) return;
    getChatbotMessages(user.id, sessionId).then((msgs) => {
      setMessages(msgs);
      setIsNewSession(msgs.length === 0);
    });
  }, [user?.id, sessionId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user?.id || sending) return;
    setSending(true);
    setInput('');
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, session_id: sessionId, content: text, is_user: true },
    ]);
    try {
      const res = await sendChatbotMessage({
        message: text,
        userName: user.full_name,
        location: user.village ?? user.district,
        language,
        sessionId,
        isNewSession,
        userId: user.id,
      });
      setIsNewSession(false);
      setMessages((m) => [
        ...m,
        {
          id: `bot-${Date.now()}`,
          session_id: sessionId,
          content: res.reply,
          is_user: false,
        },
      ]);
      if (user.id) getChatbotSessions(user.id).then(setSessions);
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setSessionId(newSessionId());
    setMessages([]);
    setIsNewSession(true);
  };

  const deleteSession = async (id: string) => {
    if (!user?.id) return;
    await softDeleteChatbotSession(user.id, id);
    if (id === sessionId) startNew();
    getChatbotSessions(user.id).then(setSessions);
  };

  const deleteAll = async () => {
    if (!user?.id || !window.confirm('Delete all chat history?')) return;
    await softDeleteAllChatbotSessions(user.id);
    startNew();
    setSessions([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100dvh' }}>
      <PageHeader title="AI Assistant" />
      <div className="page" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 0, maxWidth: 720 }}>
        {sessions.length > 0 && (
          <div className="flex gap-sm mb-md" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
            <button type="button" className="chip chip--active" onClick={startNew}>
              + New
            </button>
            {sessions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`chip ${s.id === sessionId ? 'chip--active' : ''}`}
                onClick={() => setSessionId(s.id)}
              >
                {s.title.slice(0, 20)}
              </button>
            ))}
            <button type="button" className="chip" onClick={deleteAll} title="Delete all">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div ref={listRef} className="chat-messages card" style={{ flex: 1, minHeight: 200 }}>
          {messages.length === 0 && (
            <p className="text-center text-secondary">
              Ask about crops, schemes, marketplace listings, or farm services.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.is_user ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
              {m.content}
            </div>
          ))}
        </div>

        <div className="flex gap-md" style={{ padding: '12px 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Raitu Mitra…"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ minWidth: 48, padding: 12 }}
            onClick={send}
            disabled={sending || !input.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
