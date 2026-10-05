import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, MapPin, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { HOME_SECTIONS, homeItemsForSection, type HomeItemRoute } from '@/lib/homeCatalog';
import { getUnreadNotificationCount } from '@/lib/finance';
import CategoryGrid from '@/components/CategoryGrid';

function routeFromHomeItem(route: HomeItemRoute): string {
  if (route.kind === 'category') {
    const p = new URLSearchParams({ section: route.section });
    if (route.subcategory) p.set('sub', route.subcategory);
    return `/category?${p}`;
  }
  if (route.kind === 'workforce') {
    const p = new URLSearchParams();
    if (route.workerType) p.set('type', route.workerType);
    return `/workforce?${p}`;
  }
  if (route.kind === 'more') return `/more/${route.sectionId}`;
  if (route.kind === 'schemes') return '/schemes';
  if (route.kind === 'screen') return route.href;
  return '/';
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.full_name) return;
    getUnreadNotificationCount(user.full_name).then(setUnread);
  }, [user?.full_name]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      <div className="flex justify-between items-center mb-md">
        <div>
          <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>{greeting()}</p>
          <h2 style={{ margin: '4px 0 0', fontSize: 22 }}>
            {t('home.greeting', 'Namaste')}, {user?.full_name?.split(' ')[0] ?? 'Farmer'}
          </h2>
        </div>
        <Link to="/notifications" style={{ position: 'relative', padding: 8 }}>
          <Bell size={22} color="#2E7D32" />
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                background: '#E53935',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 999,
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>

      <button
        type="button"
        className="input flex items-center gap-md mb-md"
        style={{ cursor: 'pointer', textAlign: 'left' }}
        onClick={() => navigate('/search')}
      >
        <Search size={18} color="#7A867A" />
        <span className="text-muted">{t('common.search', 'Search')} products, workers…</span>
      </button>

      <Link
        to="/location"
        className="card flex items-center gap-md mb-lg"
        style={{ padding: 12, marginBottom: 16 }}
      >
        <MapPin size={18} color="#2E7D32" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {user?.village || user?.district || 'Set your location'}
        </span>
      </Link>

      <Link
        to="/schemes"
        className="card mb-lg"
        style={{
          padding: 16,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #E8F5E9, #FFF9C4)',
          display: 'block',
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Government Schemes</h3>
        <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>
          PM-KISAN, crop insurance & more →
        </p>
      </Link>

      {HOME_SECTIONS.map((section) => (
        <section key={section.id} style={{ marginBottom: 28 }}>
          <div className="flex justify-between items-center mb-md">
            <h3 style={{ margin: 0, fontSize: 17 }}>{section.title}</h3>
            {section.viewAllRoute && (
              <Link
                to={routeFromHomeItem(section.viewAllRoute)}
                style={{ color: '#2E7D32', fontWeight: 700, fontSize: 13 }}
              >
                {t('common.viewAll', 'View All')}
              </Link>
            )}
          </div>
          <CategoryGrid items={homeItemsForSection(section)} />
        </section>
      ))}
    </div>
  );
}
