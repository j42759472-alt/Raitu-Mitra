import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Briefcase, Home, Search, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { getWalletStatus, walletBannerText, type WalletStatus } from '@/lib/wallet';

const TAB_ITEMS = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);

  useEffect(() => {
    if (!user?.full_name) return;
    getWalletStatus(user.full_name, user.id).then(setWalletStatus);
  }, [user?.full_name, user?.id, location.pathname]);

  const banner = walletStatus ? walletBannerText(walletStatus) : null;
  const pageTitle =
    location.pathname === '/search'
      ? t('common.search', 'Search')
      : location.pathname === '/jobs'
        ? 'Jobs'
        : location.pathname === '/settings'
          ? t('settings.title', 'Settings')
          : t('common.appName', 'Raitu Mitra');

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__title">{pageTitle}</span>
        {user && (
          <span style={{ fontSize: 13, opacity: 0.9 }}>
            {user.full_name.split(' ')[0]}
          </span>
        )}
      </header>

      {banner && (
        <div className="wallet-banner">
          {banner}{' '}
          <Link to="/payments" style={{ color: '#2E7D32', fontWeight: 700 }}>
            Pay now
          </Link>
        </div>
      )}

      <div className="app-body">
        <nav className="app-sidebar" aria-label="Main navigation">
          {TAB_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {TAB_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        className="fab"
        aria-label="Open chatbot"
        onClick={() => navigate('/chatbot')}
      >
        <Bot size={26} />
      </button>
    </div>
  );
}
