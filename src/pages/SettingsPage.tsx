import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell, ChevronRight, CreditCard, LogOut, MessageSquare, Trash2, User,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Language } from '@/types';
import { getEarningsSummary, type EarningsSummary } from '@/lib/finance';
import { deleteUserAccount, loadUserRatingAggregates } from '@/lib/users';
import { loadProfilePhotoUri, promptProfilePhoto } from '@/lib/profilePhoto';
import PayNowModal from '@/components/PayNowModal';

const languages: { code: Language; label: string }[] = [
  { code: 'te', label: 'తెలుగు' },
  { code: 'en', label: 'English' },
];

const menuItems = [
  { icon: User, label: 'Edit Profile', route: '/profile-setup' },
  { icon: CreditCard, label: 'Platform Fee', route: '/payments' },
  { icon: Bell, label: 'Notifications', route: '/notifications' },
  { icon: MessageSquare, label: 'Feedback', route: '/feedback' },
];

function formatRupee(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, language, setLanguage, logout, setUser } = useStore();
  const [earnings, setEarnings] = useState<EarningsSummary>({ today: 0, month: 0, pending: 0 });
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfilePhotoUri().then(setPhotoUri);
  }, []);

  useEffect(() => {
    if (!user?.full_name) return;
    loadUserRatingAggregates(user.full_name, user.id).then(({ avg, count }) => {
      if (user.avg_rating !== avg || user.total_ratings !== count) {
        setUser({ ...user, avg_rating: avg, total_ratings: count });
      }
    });
    getEarningsSummary(user.full_name).then(setEarnings);
  }, [user?.full_name, user?.id]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm', 'Are you sure you want to logout?'))) {
      logout();
      navigate('/login');
    }
  };

  const runDelete = async () => {
    if (!user?.id || !deletePw.trim()) return;
    setDeleting(true);
    try {
      const result = await deleteUserAccount(user.id, deletePw);
      if (result.success) {
        logout();
        navigate('/login');
        return;
      }
      if (result.error === 'invalid_password') {
        window.alert('Incorrect password');
        return;
      }
      if (result.error === 'open_orders') {
        window.alert(`You have ${result.openOrderCount ?? 0} open order(s). Complete or cancel them first.`);
        return;
      }
      if (result.error === 'negative_balance') {
        window.alert(`Clear outstanding balance of ₹${Math.abs(Math.round(result.netBalance ?? 0)).toLocaleString('en-IN')} first.`);
        return;
      }
      window.alert(result.error ?? 'Could not delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="card flex items-center gap-lg" style={{ padding: 20, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => promptProfilePhoto(setPhotoUri)}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#E0E0E0',
          }}
        >
          {photoUri ? (
            <img src={photoUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={32} style={{ margin: '20px auto' }} />
          )}
        </button>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{user?.full_name}</h2>
          <p className="text-secondary" style={{ margin: 0, fontSize: 13 }}>{user?.phone}</p>
          {user && user.total_ratings > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#2E7D32' }}>
              ★ {user.avg_rating} ({user.total_ratings})
            </p>
          )}
        </div>
      </div>

      <div className="grid-3 gap-md mb-lg">
        {[
          { label: 'Today', value: earnings.today },
          { label: 'This Month', value: earnings.month },
          { label: 'Pending', value: earnings.pending },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center" style={{ padding: 12 }}>
            <p className="text-secondary" style={{ margin: '0 0 4px', fontSize: 11 }}>{label}</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#2E7D32' }}>{formatRupee(value)}</p>
          </div>
        ))}
      </div>

      <div className="card mb-lg" style={{ padding: 4 }}>
        {menuItems.map(({ icon: Icon, label, route }) => (
          <Link
            key={route}
            to={route}
            className="flex items-center justify-between"
            style={{ padding: '14px 16px', borderBottom: '1px solid #E6EEE6' }}
          >
            <span className="flex items-center gap-md">
              <Icon size={20} color="#2E7D32" />
              {label}
            </span>
            <ChevronRight size={18} color="#7A867A" />
          </Link>
        ))}
        <button
          type="button"
          className="flex items-center justify-between w-full"
          style={{ padding: '14px 16px' }}
          onClick={() => setPayOpen(true)}
        >
          <span className="flex items-center gap-md">
            <CreditCard size={20} color="#2E7D32" />
            Pay Now
          </span>
          <ChevronRight size={18} color="#7A867A" />
        </button>
      </div>

      <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('language.changeLang', 'Change Language')}</p>
      <div className="flex gap-sm mb-lg">
        {languages.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className={`chip ${language === code ? 'chip--active' : ''}`}
            onClick={() => handleLanguageChange(code)}
          >
            {label}
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-secondary w-full mb-md" onClick={handleLogout}>
        <LogOut size={18} />
        {t('auth.logout', 'Logout')}
      </button>

      <button
        type="button"
        className="btn btn-outline w-full"
        style={{ color: '#E53935', borderColor: '#E53935' }}
        onClick={() => setShowDelete(true)}
      >
        <Trash2 size={18} />
        {t('settings.deleteAccount', 'Delete Account')}
      </button>

      <PayNowModal open={payOpen} onClose={() => setPayOpen(false)} />

      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)} role="presentation">
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3>Delete Account</h3>
            <p className="text-secondary">Enter your password to confirm permanent deletion.</p>
            <input
              className="input mb-md"
              type="password"
              value={deletePw}
              onChange={(e) => setDeletePw(e.target.value)}
              placeholder="Password"
            />
            <div className="flex gap-md">
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: '#E53935' }}
                onClick={runDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
