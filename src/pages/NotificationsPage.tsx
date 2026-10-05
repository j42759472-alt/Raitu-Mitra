import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listNotificationsForUser,
  markNotificationRead,
  dismissNotification,
  type AppNotificationRow,
} from '@/lib/finance';
import { useStore } from '@/store/useStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';

export default function NotificationsPage() {
  const user = useStore((s) => s.user);
  const [items, setItems] = useState<AppNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user?.full_name) return;
    listNotificationsForUser(user.full_name).then(setItems).finally(() => setLoading(false));
  };

  useEffect(load, [user?.full_name]);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    load();
  };

  const dismiss = async (id: string) => {
    await dismissNotification(id);
    load();
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="page">
        {items.length === 0 ? (
          <EmptyState title="No notifications" />
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              className="card mb-md"
              style={{
                padding: 16,
                opacity: n.is_read ? 0.75 : 1,
                borderLeft: n.is_read ? undefined : '4px solid #2E7D32',
              }}
            >
              <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{n.title}</h3>
              <p className="text-secondary" style={{ margin: '0 0 8px', fontSize: 13 }}>{n.body}</p>
              {n.reference_id && n.type === 'ORDER' && (
                <Link to={`/chat/${n.reference_id}`} className="chip mb-md" style={{ display: 'inline-block' }}>
                  View order
                </Link>
              )}
              <div className="flex gap-sm">
                {!n.is_read && (
                  <button type="button" className="chip" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                )}
                <button type="button" className="chip" onClick={() => dismiss(n.id)}>
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
