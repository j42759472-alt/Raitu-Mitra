import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { updateUserProfile, toProfileWithRatings } from '@/lib/users';
import { promptProfilePhoto, loadProfilePhotoUri } from '@/lib/profilePhoto';
import type { UserRole } from '@/types';
import PageHeader from '@/components/PageHeader';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'business', label: 'Business' },
];

export default function ProfileSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, language } = useStore();
  const [name, setName] = useState(user?.full_name ?? '');
  const [village, setVillage] = useState(user?.village ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [stateName, setStateName] = useState(user?.state ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'farmer');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfilePhotoUri().then(setPhotoUri);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const remote = await updateUserProfile(user.id, {
        displayName: name,
        village,
        district,
        state: stateName,
        role,
        language,
      });
      const profile = await toProfileWithRatings(remote);
      setUser(profile);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('profile.setup', 'Set Up Profile')} backTo="/settings" />
      <form className="page" style={{ maxWidth: 520 }} onSubmit={save}>
        <div className="text-center mb-md">
          <button
            type="button"
            onClick={() => promptProfilePhoto(setPhotoUri)}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #2E7D32',
              margin: '0 auto',
              background: '#E8F5E9',
            }}
          >
            {photoUri ? (
              <img src={photoUri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 32 }}>📷</span>
            )}
          </button>
          <p className="text-secondary" style={{ fontSize: 13, marginTop: 8 }}>
            {t('profile.addPhoto', 'Add Photo')}
          </p>
        </div>

        <label className="text-secondary" style={{ fontSize: 13 }}>{t('profile.fullName', 'Full Name')}</label>
        <input className="input mb-md" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="text-secondary" style={{ fontSize: 13 }}>{t('profile.village', 'Village')}</label>
        <input className="input mb-md" value={village} onChange={(e) => setVillage(e.target.value)} />

        <label className="text-secondary" style={{ fontSize: 13 }}>{t('profile.district', 'District')}</label>
        <input className="input mb-md" value={district} onChange={(e) => setDistrict(e.target.value)} />

        <label className="text-secondary" style={{ fontSize: 13 }}>{t('profile.state', 'State')}</label>
        <input className="input mb-md" value={stateName} onChange={(e) => setStateName(e.target.value)} />

        <label className="text-secondary" style={{ fontSize: 13 }}>{t('profile.role', 'Role')}</label>
        <div className="flex gap-sm mb-md mt-md" style={{ flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`chip ${role === r.value ? 'chip--active' : ''}`}
              onClick={() => setRole(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#E53935' }}>{error}</p>}
        <button type="submit" className="btn btn-primary w-full mt-lg" disabled={loading}>
          {loading ? t('common.loading') : t('common.save', 'Save')}
        </button>
      </form>
    </div>
  );
}
