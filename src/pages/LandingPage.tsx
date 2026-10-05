import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  HandCoins,
  Languages,
  MapPinned,
  MessageCircle,
  Tractor,
  Users,
  Wheat,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Language } from '@/types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
];

const HOW_STEPS = ['register', 'find', 'hire', 'pay'] as const;

const FEATURES = [
  { id: 'workforce', icon: Users },
  { id: 'equipment', icon: Tractor },
  { id: 'marketplace', icon: Wheat },
  { id: 'schemes', icon: HandCoins },
] as const;

const FIELD_POINTS = [
  { id: 'bilingual', icon: Languages },
  { id: 'nearby', icon: MapPinned },
  { id: 'chat', icon: MessageCircle },
  { id: 'ai', icon: Bot },
] as const;

const AUDIENCES = ['farmer', 'worker'] as const;

const SKILL_KEYS = ['field', 'animals', 'equipment', 'postHarvest', 'specialized'] as const;

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useStore();

  const handleLang = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="landing">
      <header className="landing-hero">
        <div className="landing-hero__media" aria-hidden="true">
          <div className="landing-hero__glow" />
          <div className="landing-hero__rows" />
          <div className="landing-hero__grain" />
        </div>

        <nav className="landing-nav" aria-label="Primary">
          <span className="landing-nav__mark">{t('common.appName')}</span>
          <div className="landing-nav__actions">
            <div className="landing-lang" role="group" aria-label={t('language.title')}>
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
            <Link to="/login" className="landing-nav__signin">
              {t('landing.signIn')}
            </Link>
          </div>
        </nav>

        <div className="landing-hero__content">
          <p className="landing-hero__brand">{t('common.appName')}</p>
          <p className="landing-hero__native" lang="te">
            {t('landing.nativeName')}
          </p>
          <h1 className="landing-hero__headline">{t('landing.headline')}</h1>
          <p className="landing-hero__support">{t('landing.support')}</p>
          <div className="landing-hero__ctas">
            <Link to="/login" className="btn btn-primary">
              {t('landing.getStarted')}
            </Link>
            <a href="#how" className="btn landing-btn-ghost">
              {t('landing.seeHow')}
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-block landing-block--problem" id="why">
          <div className="landing-wrap landing-wrap--narrow">
            <p className="landing-kicker">{t('landing.problem.kicker')}</p>
            <h2 className="landing-title">{t('landing.problem.title')}</h2>
            <p className="landing-lead">{t('landing.problem.lead')}</p>
            <ul className="landing-pain">
              {(t('landing.problem.points', { returnObjects: true }) as string[]).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-block landing-block--audience" id="who">
          <div className="landing-wrap">
            <p className="landing-kicker">{t('landing.audience.kicker')}</p>
            <h2 className="landing-title">{t('landing.audience.title')}</h2>
            <div className="landing-split">
              {AUDIENCES.map((id) => (
                <article key={id} className="landing-split__col">
                  <h3 className="landing-split__title">{t(`landing.audience.${id}.title`)}</h3>
                  <p className="landing-split__role">{t(`landing.audience.${id}.role`)}</p>
                  <ul className="landing-bullets">
                    {(t(`landing.audience.${id}.points`, { returnObjects: true }) as string[]).map(
                      (point) => (
                        <li key={point}>{point}</li>
                      ),
                    )}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-block landing-block--how" id="how">
          <div className="landing-wrap">
            <p className="landing-kicker">{t('landing.how.kicker')}</p>
            <h2 className="landing-title">{t('landing.how.title')}</h2>
            <ol className="landing-steps">
              {HOW_STEPS.map((id, index) => (
                <li key={id} className="landing-steps__item">
                  <span className="landing-steps__num" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="landing-steps__title">{t(`landing.how.${id}.title`)}</h3>
                  <p className="landing-steps__body">{t(`landing.how.${id}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-block landing-block--features" id="features">
          <div className="landing-wrap">
            <p className="landing-kicker">{t('landing.features.kicker')}</p>
            <h2 className="landing-title">{t('landing.features.title')}</h2>
            <p className="landing-lead">{t('landing.features.lead')}</p>

            <div className="landing-features">
              {FEATURES.map(({ id, icon: Icon }) => (
                <article key={id} className="landing-feature">
                  <div className="landing-feature__head">
                    <Icon className="landing-feature__icon" size={28} strokeWidth={1.75} aria-hidden />
                    <h3 className="landing-feature__title">{t(`landing.features.${id}.title`)}</h3>
                  </div>
                  <p className="landing-feature__body">{t(`landing.features.${id}.body`)}</p>
                  <ul className="landing-bullets">
                    {(t(`landing.features.${id}.points`, { returnObjects: true }) as string[]).map(
                      (point) => (
                        <li key={point}>{point}</li>
                      ),
                    )}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-block landing-block--skills" id="skills">
          <div className="landing-wrap">
            <p className="landing-kicker">{t('landing.skills.kicker')}</p>
            <h2 className="landing-title">{t('landing.skills.title')}</h2>
            <p className="landing-lead">{t('landing.skills.lead')}</p>
            <div className="landing-skills">
              {SKILL_KEYS.map((id) => (
                <div key={id} className="landing-skills__item">
                  <h3 className="landing-skills__name">{t(`landing.skills.${id}.name`)}</h3>
                  <p className="landing-skills__examples">{t(`landing.skills.${id}.examples`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-block landing-block--field" id="built-for">
          <div className="landing-wrap">
            <p className="landing-kicker">{t('landing.field.kicker')}</p>
            <h2 className="landing-title">{t('landing.field.title')}</h2>
            <div className="landing-field">
              {FIELD_POINTS.map(({ id, icon: Icon }) => (
                <article key={id} className="landing-field__item">
                  <Icon className="landing-field__icon" size={24} strokeWidth={1.75} aria-hidden />
                  <h3 className="landing-field__title">{t(`landing.field.${id}.title`)}</h3>
                  <p className="landing-field__body">{t(`landing.field.${id}.body`)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta" id="start">
          <div className="landing-wrap landing-wrap--narrow landing-cta__inner">
            <h2 className="landing-cta__title">{t('landing.cta.title')}</h2>
            <p className="landing-cta__body">{t('landing.cta.body')}</p>
            <Link to="/login" className="btn btn-primary">
              {t('landing.getStarted')}
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer__inner">
          <div>
            <p className="landing-footer__brand">{t('common.appName')}</p>
            <p className="landing-footer__tag">{t('landing.footer.tagline')}</p>
          </div>
          <div className="landing-footer__links">
            <a href="#features">{t('landing.footer.features')}</a>
            <a href="#how">{t('landing.footer.how')}</a>
            <Link to="/login">{t('landing.signIn')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
