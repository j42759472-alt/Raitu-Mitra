import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';

type ChatMessage = {
  id: string;
  sender_name: string;
  receiver_name: string;
  content: string;
  created_at: string | null;
};

type OrderChatInfo = {
  id: string;
  status: string;
  buyer_name: string;
  seller_name: string;
  product_title: string;
};

function formatTime(s: string | null | undefined): string {
  if (!s) return '';
  return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const user = useStore((s) => s.user);
  const currentUserName = user?.full_name ?? '';
  const listRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<OrderChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherUserName = useMemo(() => {
    if (!order) return '';
    return order.buyer_name === currentUserName ? order.seller_name : order.buyer_name;
  }, [order, currentUserName]);

  const chatClosed = useMemo(() => {
    const st = (order?.status ?? '').toUpperCase();
    return st === 'COMPLETED' || st === 'CANCELLED' || st === 'REJECTED';
  }, [order]);

  useEffect(() => {
    if (!orderId || !currentUserName) return;
    let mounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const { data: orderRow, error: orderErr } = await supabase
          .from('orders')
          .select('id,status,buyer_name,seller_name,product_title')
          .eq('id', orderId)
          .maybeSingle();
        if (orderErr) throw orderErr;
        if (!mounted) return;
        setOrder(orderRow as OrderChatInfo | null);

        const { data: msgRows, error: msgErr } = await supabase
          .from('messages')
          .select('id,sender_name,receiver_name,content,created_at')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        if (msgErr) throw msgErr;
        if (!mounted) return;
        setMessages((msgRows ?? []) as ChatMessage[]);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Could not load chat.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    const channel = supabase
      .channel(`messages:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [orderId, currentUserName]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || !orderId || !order || !otherUserName || sending || chatClosed) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        id: crypto.randomUUID(),
        order_id: orderId,
        sender_name: currentUserName,
        receiver_name: otherUserName,
        content: text,
      });
      setInput('');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div>
        <PageHeader title="Chat" />
        <p className="page text-center text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100dvh' }}>
      <PageHeader title={otherUserName || 'Chat'} subtitle={order?.product_title} />
      <div ref={listRef} className="chat-messages" style={{ flex: 1 }}>
        {messages.map((m) => {
          const mine = m.sender_name === currentUserName;
          return (
            <div key={m.id}>
              <div className={`chat-bubble ${mine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                {m.content}
              </div>
              <p className="text-muted" style={{ fontSize: 10, textAlign: mine ? 'right' : 'left', margin: '2px 0 8px' }}>
                {formatTime(m.created_at)}
              </p>
            </div>
          );
        })}
      </div>
      {chatClosed ? (
        <div className="text-center text-secondary" style={{ padding: 16 }}>
          Chat closed — order is {order?.status?.toLowerCase()}
        </div>
      ) : (
        <div className="flex gap-md" style={{ padding: 16, background: 'white', borderTop: '1px solid #E6EEE6' }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button type="button" className="btn btn-primary" onClick={send} disabled={sending || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
