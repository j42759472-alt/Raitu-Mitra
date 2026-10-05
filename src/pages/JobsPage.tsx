import { Link } from 'react-router-dom';
import { CheckCircle, ClipboardList, Landmark, Package } from 'lucide-react';

const CARDS = [
  {
    to: '/jobs/my-jobs',
    icon: Package,
    title: 'My Jobs',
    subtitle: 'Your listings & sales',
    color: '#ECFDF5',
    iconColor: '#065F46',
  },
  {
    to: '/jobs/orders?mode=active',
    icon: ClipboardList,
    title: 'My Orders',
    subtitle: 'Active purchases & hires',
    color: '#EFF6FF',
    iconColor: '#1E40AF',
  },
  {
    to: '/jobs/orders?mode=completed',
    icon: CheckCircle,
    title: 'Completed',
    subtitle: 'Past orders',
    color: '#FFFBEB',
    iconColor: '#92400E',
  },
  {
    to: '/jobs/my-schemes',
    icon: Landmark,
    title: 'My Schemes',
    subtitle: 'Applied govt schemes',
    color: '#F5F3FF',
    iconColor: '#5B21B6',
  },
];

export default function JobsPage() {
  return (
    <div className="page">
      <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Jobs Hub</h2>
      <div className="grid-2">
        {CARDS.map(({ to, icon: Icon, title, subtitle, color, iconColor }) => (
          <Link
            key={to}
            to={to}
            className="card"
            style={{ padding: 20, display: 'block', background: color }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Icon size={22} color={iconColor} />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{title}</h3>
            <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>{subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
