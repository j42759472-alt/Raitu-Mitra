import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  cancelOrder,
  checkAndRevokeExpiredOrders,
  completeOrder,
  isWithinCompletedOrdersTtl,
  type OrderLifecycleRow,
} from '@/lib/orders';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import StatusBadge from '@/components/StatusBadge';

export default function OrdersPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'active';
  const user = useStore((s) => s.user);
  const [orders, setOrders] = useState<OrderLifecycleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user?.full_name) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`buyer_name.eq.${user.full_name},seller_name.eq.${user.full_name}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []) as OrderLifecycleRow[];
    await checkAndRevokeExpiredOrders(rows);
    setOrders(rows);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [user?.full_name]);

  const filtered = useMemo(() => {
    const terminal = ['COMPLETED', 'CANCELLED', 'REJECTED'];
    if (mode === 'completed') {
      return orders.filter(
        (o) => terminal.includes(o.status) && isWithinCompletedOrdersTtl(o),
      );
    }
    return orders.filter((o) => !terminal.includes(o.status));
  }, [orders, mode]);

  const handleComplete = async (order: OrderLifecycleRow) => {
    const entered = pinInput[order.id]?.trim();
    if (!entered || entered !== (order.pin ?? '')) {
      window.alert('Incorrect PIN');
      return;
    }
    await completeOrder(order);
    await load();
  };

  const handleCancel = async (order: OrderLifecycleRow) => {
    if (!user?.full_name) return;
    if (!window.confirm('Cancel this order?')) return;
    try {
      await cancelOrder(order, user.full_name);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not cancel');
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title={mode === 'completed' ? 'Completed Orders' : 'My Orders'} />
      <div className="page">
        {filtered.length === 0 ? (
          <EmptyState title="No orders" />
        ) : (
          filtered.map((order) => {
            const isSeller = order.seller_name === user?.full_name;
            const canComplete =
              isSeller &&
              (order.status === 'ACCEPTED' || order.status === 'CONFIRMED');
            return (
              <div key={order.id} className="card mb-md" style={{ padding: 16 }}>
                <div className="flex justify-between items-start mb-md">
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{order.product_title}</h3>
                    <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>
                      {isSeller ? `Buyer: ${order.buyer_name}` : `Seller: ${order.seller_name}`}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#2E7D32' }}>
                  ₹{Number(order.total_price).toLocaleString()}
                </p>
                <Link to={`/chat/${order.id}`} className="chip mb-md" style={{ display: 'inline-block' }}>
                  Chat
                </Link>
                {canComplete && (
                  <div className="flex gap-sm mt-md">
                    <input
                      className="input"
                      placeholder="Enter PIN"
                      value={pinInput[order.id] ?? ''}
                      onChange={(e) =>
                        setPinInput((p) => ({ ...p, [order.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleComplete(order)}
                    >
                      Complete
                    </button>
                  </div>
                )}
                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(order.status) && (
                  <button
                    type="button"
                    className="btn btn-secondary w-full mt-md"
                    onClick={() => handleCancel(order)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
