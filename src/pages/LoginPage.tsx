import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import {
  signInWithPhonePassword,
  signUpWithPhonePassword,
  toProfileWithRatings,
} from '@/lib/users';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
];

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage, setUser, setAuthenticated, setPhone } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhoneLocal] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLang = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError(t('auth.invalidPhone', 'Please enter a valid 10-digit mobile number'));
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const remote =
        mode === 'signup'
          ? await signUpWithPhonePassword({
              phone,
              name,
              password,
              language,
            })
          : await signInWithPhonePassword(phone, password);
      const profile = await toProfileWithRatings(remote);
      setUser(profile);
      setPhone(remote.phone);
      setAuthenticated(true);
      const needsSetup = !profile.village && !profile.district;
      navigate(needsSetup ? '/profile-setup' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error', 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: 420,
      }}
    >
      <div className="text-center mb-md">
        <h1 style={{ fontSize: 28, margin: '0 0 8px', color: '#2E7D32' }}>
          {t('common.appName', 'Raitu Mitra')}
        </h1>
        <p className="text-secondary">{t('auth.tagline', 'Your agriculture friend')}</p>
      </div>

      <div className="flex gap-sm mb-md" style={{ justifyContent: 'center' }}>
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className={`chip ${language === code ? 'chip--active' : ''}`}
            onClick={() => handleLang(code)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="card" style={{ padding: 24 }} onSubmit={submit}>
        <div className="flex gap-sm mb-md">
          <button
            type="button"
            className={`chip ${mode === 'signin' ? 'chip--active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`chip ${mode === 'signup' ? 'chip--active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' && (
          <div className="mb-md">
            <label style={{ fontWeight: 600, fontSize: 13 }}>Full Name</label>
            <input
              className="input mt-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        )}

        <div className="mb-md">
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            {t('auth.enterPhone', 'Mobile number')}
          </label>
          <input
            className="input mt-md"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={t('auth.phonePlaceholder', '10-digit mobile number')}
          />
        </div>

        <div className="mb-md">
          <label style={{ fontWeight: 600, fontSize: 13 }}>Password</label>
          <input
            className="input mt-md"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 13 }}>{error}</p>}

        <button type="submit" className="btn btn-primary w-full mt-lg" disabled={loading}>
          {loading ? t('common.loading', 'Loading…') : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
