import { useEffect, useState } from 'react';
import { deleteFeedback, listFeedback, sendFeedback } from '@/lib/feedback';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function FeedbackPage() {
  const user = useStore((s) => s.user);
  const [text, setText] = useState('');
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listFeedback>>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user?.id) return;
    listFeedback(user.id).then(setHistory).finally(() => setLoading(false));
  };

  useEffect(load, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !text.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendFeedback({
      userId: user.id,
      userName: user.full_name,
      text: text.trim(),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setText('');
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Feedback" />
      <div className="page" style={{ maxWidth: 520 }}>
        <form onSubmit={submit} className="card mb-lg" style={{ padding: 16 }}>
          <label className="text-secondary" style={{ fontSize: 13 }}>Your feedback</label>
          <textarea
            className="input mb-md"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us how we can improve…"
            style={{ resize: 'vertical' }}
          />
          {error && <p style={{ color: '#E53935', fontSize: 13 }}>{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={sending || !text.trim()}>
            {sending ? 'Sending…' : 'Send Feedback'}
          </button>
        </form>

        <h3 style={{ fontSize: 16 }}>Recent feedback</h3>
        {history.length === 0 ? (
          <EmptyState title="No feedback yet" />
        ) : (
          history.map((item) => (
            <div key={item.id} className="card mb-md" style={{ padding: 12 }}>
              <p style={{ margin: '0 0 8px', lineHeight: 1.5 }}>{item.feedback_text}</p>
              <div className="flex justify-between items-center">
                <span className="text-muted" style={{ fontSize: 11 }}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </span>
                <button type="button" className="chip" onClick={() => deleteFeedback(item.id).then(load)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
