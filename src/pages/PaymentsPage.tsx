import { useEffect, useState } from 'react';
import { listPaymentHistory, type PaymentHistoryItem } from '@/lib/finance';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import PayNowModal from '@/components/PayNowModal';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function PaymentsPage() {
  const user = useStore((s) => s.user);
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);

  const load = () => {
    if (!user?.full_name) return;
    listPaymentHistory(user.full_name).then(({ items }) => setItems(items)).finally(() => setLoading(false));
  };

  useEffect(load, [user?.full_name, user?.id]);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Platform Fee" />
      <div className="page">
        <button type="button" className="btn btn-primary w-full mb-lg" onClick={() => setPayOpen(true)}>
          Pay Now
        </button>
        {items.length === 0 ? (
          <EmptyState title="No payment history" />
        ) : (
          items.map((item) => (
            <div key={item.id} className="card mb-md" style={{ padding: 16 }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{item.title}</h3>
                  <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>{item.subtitle}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    const status = (item.status ?? '').toLowerCase();
                    const isFeePayment = item.type === 'payment';
                    const isCompleted = status === 'completed' || status === 'paid' || status === 'success' || status === 'verified';
                    const isFailed = status === 'failed' || status === 'cancelled' || status === 'canceled';
                    const showCredit = isFeePayment && isCompleted;
                    const color = showCredit ? '#2E7D32' : isFailed ? '#E53935' : isFeePayment ? '#757575' : '#E53935';
                    const prefix = showCredit ? '+' : '';
                    return (
                      <p style={{ margin: 0, fontWeight: 700, color }}>
                        {prefix}₹{Math.abs(item.amount).toLocaleString()}
                      </p>
                    );
                  })()}
                  <span className="chip" style={{ fontSize: 10 }}>{item.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <PayNowModal open={payOpen} onClose={() => setPayOpen(false)} onSuccess={load} />
    </div>
  );
}
