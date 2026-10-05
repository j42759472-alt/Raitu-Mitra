import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'Nothing here yet',
  message,
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center" style={{ padding: '48px 24px' }}>
      <Inbox size={48} color="#7A867A" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ margin: '0 0 8px', fontSize: 17 }}>{title}</h3>
      {message && <p className="text-secondary" style={{ margin: '0 0 16px' }}>{message}</p>}
      {action}
    </div>
  );
}
