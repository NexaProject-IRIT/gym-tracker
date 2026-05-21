import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ─── SVG-иконки ────────────────────────────────────────────────────────────
const IconDumbbell = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2" />
  </svg>
);
const IconBook = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 014 17.5z" />
    <path d="M4 17.5A2.5 2.5 0 016.5 15H20" />
    <path d="M8 7h8M8 11h5" />
  </svg>
);
const IconAi = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="12" rx="3" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <path d="M12 2v4M9 18v3M15 18v3" />
  </svg>
);
const IconDownload = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);
const IconArrowRight = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const IconArrowDown = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const IconCheck = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5L20 6" />
  </svg>
);
const IconSparkle = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);
const IconChartBar = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="13" width="4" height="8" rx="1" />
    <rect x="10" y="8" width="4" height="13" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
  </svg>
);

// ─── Главный компонент ───────────────────────────────────────────────────
export const LandingPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 880);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 880);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <style>{LANDING_CSS}</style>

      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--text)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* ── Декоративные орбы (фон) ── */}
        <BackgroundOrbs />

        {/* ── Sticky хедер ── */}
        <LandingHeader
          isDark={isDark}
          toggleTheme={toggleTheme}
          onLogin={() => navigate('/login')}
          onRegister={() => navigate('/register')}
          isMobile={isMobile}
        />

        <main style={{ position: 'relative', zIndex: 1 }}>
          <HeroSection isMobile={isMobile} onPrimary={() => navigate('/register')} onSecondary={() => scrollTo('features')} />
          <TrustLine />
          <FeaturesBento isMobile={isMobile} />
          <HowItWorksSection isMobile={isMobile} />
          <FinalCta onClick={() => navigate('/register')} />
          <FooterSection />
        </main>
      </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════════════
const LANDING_CSS = `
  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0) rotate(-1.5deg); }
    50%      { transform: translateY(-10px) rotate(-1.5deg); }
  }
  @keyframes lp-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.55; transform: scale(0.9); }
  }
  @keyframes lp-drift1 {
    0%, 100% { transform: translate(0, 0); }
    50%      { transform: translate(40px, -30px); }
  }
  @keyframes lp-drift2 {
    0%, 100% { transform: translate(0, 0); }
    50%      { transform: translate(-30px, 40px); }
  }
  @keyframes lp-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes lp-stepIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .lp-fade { animation: lp-fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .lp-press { transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s; }
  .lp-press:active { transform: scale(0.98); }
  .lp-cta-primary:hover { box-shadow: 0 16px 44px var(--accent-a30); transform: translateY(-2px); }
  .lp-cta-primary:active { transform: translateY(0) scale(0.99); }
  .lp-cta-ghost:hover { border-color: var(--accent-a30); color: var(--accent); }
  .lp-link:hover { color: var(--accent); }
  .lp-link { transition: color 0.15s; }
  .lp-feature-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
  }
  .lp-feature-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(420px circle at var(--mx,50%) var(--my,50%), var(--accent-a20), transparent 50%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .lp-feature-card:hover::before { opacity: 1; }
  .lp-feature-card:hover { border-color: var(--accent-a30); transform: translateY(-3px); }
  .lp-phone-float { animation: lp-float 6s ease-in-out infinite; }
  .lp-pulse-dot { animation: lp-pulse 2s ease-in-out infinite; }
  .lp-orb-1 { animation: lp-drift1 18s ease-in-out infinite; }
  .lp-orb-2 { animation: lp-drift2 22s ease-in-out infinite; }
  .lp-orb-3 { animation: lp-drift1 26s ease-in-out infinite reverse; }
  .lp-step-line {
    background-image: linear-gradient(180deg, var(--border3) 50%, transparent 0);
    background-size: 1px 8px;
    background-repeat: repeat-y;
    background-position: center;
  }
  .lp-marquee-track {
    display: flex;
    width: max-content;
    animation: lp-marquee 30s linear infinite;
  }
  @keyframes lp-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
`;

// ════════════════════════════════════════════════════════════════════════
// Header
// ════════════════════════════════════════════════════════════════════════
const LandingHeader = ({
  isDark, toggleTheme, onLogin, onRegister, isMobile,
}: {
  isDark: boolean; toggleTheme: () => void; onLogin: () => void; onRegister: () => void; isMobile: boolean;
}) => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 50,
    backdropFilter: 'blur(20px) saturate(140%)',
    WebkitBackdropFilter: 'blur(20px) saturate(140%)',
    background: 'var(--surface-glass)',
    borderBottom: '1px solid var(--border)',
  }}>
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: isMobile ? '12px 18px' : '14px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--accent-a12)',
          border: '1px solid var(--accent-a20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <IconDumbbell s={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>GymLog</div>
          <div style={{ fontSize: 10.5, color: 'var(--ghost)', marginTop: 1, letterSpacing: '0.04em' }}>
            трекер тренировок
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={toggleTheme}
          title={isDark ? 'Светлая тема' : 'Тёмная тема'}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'transparent',
            border: '1px solid var(--border2)',
            color: 'var(--muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-a20)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </button>

        {!isMobile && (
          <button
            onClick={onLogin}
            className="lp-link"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 13.5, fontWeight: 500,
              padding: '8px 14px', borderRadius: 10,
            }}
          >
            Войти
          </button>
        )}
        <button
          onClick={onRegister}
          className="lp-press"
          style={{
            background: 'var(--accent)', color: 'var(--accent-fg)',
            border: 'none', cursor: 'pointer',
            padding: isMobile ? '8px 14px' : '9px 18px',
            borderRadius: 10,
            fontSize: isMobile ? 13 : 13.5, fontWeight: 700,
            letterSpacing: '-0.005em',
          }}
        >
          Начать
        </button>
      </div>
    </div>
  </header>
);

// ════════════════════════════════════════════════════════════════════════
// Background orbs
// ════════════════════════════════════════════════════════════════════════
const BackgroundOrbs = () => (
  <div aria-hidden style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    overflow: 'hidden', zIndex: 0,
  }}>
    <div className="lp-orb-1" style={{
      position: 'absolute', top: '-10%', left: '-5%',
      width: 560, height: 560, borderRadius: '50%',
      background: 'radial-gradient(circle, var(--accent-a20) 0%, transparent 60%)',
      filter: 'blur(40px)',
    }} />
    <div className="lp-orb-2" style={{
      position: 'absolute', top: '40%', right: '-10%',
      width: 480, height: 480, borderRadius: '50%',
      background: 'radial-gradient(circle, var(--accent-a12) 0%, transparent 65%)',
      filter: 'blur(50px)',
    }} />
    <div className="lp-orb-3" style={{
      position: 'absolute', bottom: '5%', left: '20%',
      width: 380, height: 380, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(196,181,253,0.10) 0%, transparent 60%)',
      filter: 'blur(60px)',
    }} />
  </div>
);

// ════════════════════════════════════════════════════════════════════════
// Hero
// ════════════════════════════════════════════════════════════════════════
const HeroSection = ({
  isMobile, onPrimary, onSecondary,
}: { isMobile: boolean; onPrimary: () => void; onSecondary: () => void }) => (
  <section style={{
    maxWidth: 1180, margin: '0 auto',
    padding: isMobile ? '40px 20px 64px' : '88px 28px 96px',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 360px)',
    gap: isMobile ? 36 : 48,
    alignItems: 'center',
    position: 'relative',
  }}>
    {/* ─── Левый блок: текст ─── */}
    <div className="lp-fade">
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px 6px 8px',
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 999,
        fontSize: 12, color: 'var(--muted)', fontWeight: 500,
        marginBottom: 22,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--accent-a20)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconSparkle s={10} />
        </span>
        <span>MVP · 100+ упражнений · GigaChat внутри</span>
      </div>

      <h1 style={{
        margin: 0,
        fontSize: isMobile ? 'clamp(36px, 9vw, 48px)' : 'clamp(48px, 5.5vw, 72px)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 0.98,
        color: 'var(--text)',
      }}>
        Дневник тренировок,
        <br />
        <span style={{ color: 'var(--text3)', fontWeight: 700 }}>которому нет </span>
        <span style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          оправданий.
        </span>
      </h1>

      <p style={{
        margin: isMobile ? '20px 0 28px' : '28px 0 36px',
        maxWidth: 480,
        fontSize: isMobile ? 15.5 : 17,
        lineHeight: 1.55,
        color: 'var(--dim)',
        fontWeight: 400,
      }}>
        Записывай подходы, смотри активность за месяц и общайся с ИИ-тренером. Зал, дом, улица — один интерфейс для всего.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={onPrimary}
          className="lp-press lp-cta-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: isMobile ? '14px 22px' : '16px 28px',
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
            color: 'var(--accent-fg)',
            fontWeight: 700, fontSize: isMobile ? 14.5 : 15.5,
            cursor: 'pointer',
            boxShadow: '0 10px 32px var(--accent-a25), inset 0 1px 0 rgba(255,255,255,0.2)',
            letterSpacing: '-0.005em',
          }}
        >
          Попробовать бесплатно
          <IconArrowRight s={15} />
        </button>
        <button
          onClick={onSecondary}
          className="lp-press lp-cta-ghost"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: isMobile ? '14px 20px' : '16px 24px',
            borderRadius: 14,
            background: 'transparent',
            border: '1px solid var(--border3)',
            color: 'var(--muted)',
            fontWeight: 600, fontSize: isMobile ? 14 : 15,
            cursor: 'pointer',
            transition: 'color 0.18s, border-color 0.18s',
            letterSpacing: '-0.005em',
          }}
        >
          Как это работает
          <IconArrowDown s={13} />
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 22, fontSize: 12.5, color: 'var(--ghost)',
        fontWeight: 500,
      }}>
        <IconCheck s={13} />
        Бесплатно. Без подписок. Без рекламы.
      </div>
    </div>

    {/* ─── Правый блок: телефон ─── */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      perspective: 1200,
      animationDelay: '0.15s',
    }} className="lp-fade">
      <PhoneMockup isMobile={isMobile} />
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════════════
// Phone mockup (CSS-арт)
// ════════════════════════════════════════════════════════════════════════
const PhoneMockup = ({ isMobile }: { isMobile: boolean }) => {
  const phoneW = isMobile ? 240 : 280;
  const phoneH = isMobile ? 480 : 560;

  // Активити-грид: 5×7. Произвольный паттерн (но детерминированный).
  const cells = (() => {
    const seed = [0, 0, 1, 0, 2, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 2, 0, 1, 0, 0, 0, 0, 1, 0, 2, 1, 0, 0, 1, 0, 2, 1, 0, 0];
    return seed;
  })();

  // 8 баров для мини-чарта
  const bars = [1, 2, 1, 3, 2, 1, 2, 3];
  const maxBar = Math.max(...bars);

  return (
    <div
      className="lp-phone-float"
      style={{
        position: 'relative',
        width: phoneW, height: phoneH,
        borderRadius: 44,
        background: 'linear-gradient(155deg, #1a1d24 0%, #0d0f14 100%)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        boxShadow:
          '0 40px 80px -20px rgba(0,0,0,0.55), ' +
          '0 0 0 1px rgba(255,255,255,0.04), ' +
          'inset 0 1px 0 rgba(255,255,255,0.08)',
        padding: 10,
        transform: 'rotate(-1.5deg)',
      }}
    >
      {/* Нотч */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 90, height: 22, borderRadius: 18,
        background: '#000', zIndex: 3,
      }} />

      {/* Экран */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 36,
        background: '#0a0c10',
        border: '1px solid rgba(255,255,255,0.04)',
        overflow: 'hidden',
        position: 'relative',
        padding: '38px 16px 16px',
      }}>
        {/* Status bar */}
        <div style={{
          position: 'absolute', top: 10, left: 18, right: 18,
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9.5, color: '#94a3b8', fontWeight: 600,
          letterSpacing: '0.02em',
        }}>
          <span>9:41</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 7, borderRadius: 2, background: '#6ee7b7', display: 'inline-block' }} />
          </span>
        </div>

        {/* Бейдж с датой */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 999,
          fontSize: 8.5, color: '#94a3b8', fontWeight: 500,
          marginBottom: 8,
        }}>
          <span style={{ color: '#6ee7b7', display: 'flex' }}><IconSun /></span>
          <span>сегодня</span>
        </div>

        {/* Приветствие */}
        <div style={{
          fontSize: 18, fontWeight: 800, color: '#f1f5f9',
          letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 14,
        }}>
          Доброе утро,
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>спортсмен</span>
        </div>

        {/* Цитата мини */}
        <div style={{
          background: '#1a1d24',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '8px 10px',
          fontSize: 9.5, color: '#cbd5e1',
          lineHeight: 1.4,
          marginBottom: 12,
          position: 'relative',
          paddingLeft: 12,
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 6, bottom: 6,
            width: 2, borderRadius: 2,
            background: 'linear-gradient(180deg, #6ee7b7, #34d399)',
          }} />
          Сегодняшняя версия тебя должна быть сильнее вчерашней.
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
          color: '#052e16',
          borderRadius: 10,
          padding: '9px 12px',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
          boxShadow: '0 6px 18px rgba(110,231,183,0.25)',
          letterSpacing: '-0.005em',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 16, height: 16, borderRadius: 5,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>+</span>
            Начать тренировку
          </span>
          <span>→</span>
        </div>

        {/* Stats row mini */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 14,
        }}>
          {[
            { v: '5', l: 'стрик' },
            { v: '42', l: 'всего' },
            { v: '8', l: 'до 50' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '8px 4px',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              textAlign: 'left', paddingLeft: 6,
            }}>
              <div style={{
                fontSize: 16, fontWeight: 800, color: '#f1f5f9',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>{s.v}</div>
              <div style={{ fontSize: 7.5, color: '#64748b', marginTop: 3,
                textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Активити-грид */}
        <div style={{
          fontSize: 8, color: '#64748b', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 5,
        }}>Активность</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 3, marginBottom: 14,
        }}>
          {cells.map((c, i) => (
            <div key={i} style={{
              aspectRatio: '1 / 1', borderRadius: 3,
              background: c === 0
                ? '#21252e'
                : c === 1
                  ? 'rgba(110,231,183,0.25)'
                  : '#6ee7b7',
              border: '1px solid ' + (c > 0 ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.05)'),
            }} />
          ))}
        </div>

        {/* Мини-чарт */}
        <div style={{
          fontSize: 8, color: '#64748b', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 5,
        }}>Тренировки в неделю</div>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 4,
          height: 36, padding: '2px 0',
        }}>
          {bars.map((b, i) => (
            <div key={i} style={{
              flex: 1,
              height: `${(b / maxBar) * 100}%`,
              minHeight: 3,
              borderRadius: 2,
              background: i === bars.length - 1 ? '#6ee7b7' : 'rgba(110,231,183,0.3)',
            }} />
          ))}
        </div>
      </div>

      {/* "Живой" индикатор */}
      <div style={{
        position: 'absolute',
        top: -8, right: -8,
        background: '#1a1d24',
        border: '1px solid rgba(110,231,183,0.3)',
        borderRadius: 999,
        padding: '4px 9px 4px 7px',
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 10, color: '#cbd5e1', fontWeight: 600,
        boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
        transform: 'rotate(3deg)',
      }}>
        <span className="lp-pulse-dot" style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#6ee7b7',
        }} />
        live
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// Trust line
// ════════════════════════════════════════════════════════════════════════
const TrustLine = () => (
  <div style={{
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: '18px 24px',
    textAlign: 'center',
  }}>
    <div style={{
      maxWidth: 720, margin: '0 auto',
      fontSize: 13, color: 'var(--dim)',
      fontWeight: 500, lineHeight: 1.5,
      letterSpacing: '-0.005em',
    }}>
      Сделано студентами, которые сами ходят в зал
      <span style={{ color: 'var(--ghost)', margin: '0 8px' }}>·</span>
      <span style={{ color: 'var(--text3)' }}>и устали от Excel-таблиц</span>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════
// Features (bento grid — без 3 равных колонок)
// ════════════════════════════════════════════════════════════════════════
const FEATURES: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  size: 'lg' | 'sm';
  visual: 'grid' | 'chat' | 'list' | 'export';
}[] = [
  {
    title: 'Дневник тренировок',
    desc: 'Подходы, вес, время, дистанция. Любой вид: силовая, кардио, йога, функционалка.',
    icon: <IconDumbbell s={20} />,
    accent: 'var(--accent)',
    size: 'lg',
    visual: 'grid',
  },
  {
    title: 'База упражнений',
    desc: '100+ упражнений с техникой, фото и подсветкой мышц.',
    icon: <IconBook s={20} />,
    accent: '#63b3ed',
    size: 'sm',
    visual: 'list',
  },
  {
    title: 'ИИ-тренер',
    desc: 'GigaChat собирает программу под твою цель и параметры.',
    icon: <IconAi s={20} />,
    accent: '#c4b5fd',
    size: 'sm',
    visual: 'chat',
  },
  {
    title: 'Экспорт истории',
    desc: 'Скачивай тренировки текстовым файлом. Никаких VPN.',
    icon: <IconDownload s={20} />,
    accent: '#fb923c',
    size: 'sm',
    visual: 'export',
  },
];

const FeaturesBento = ({ isMobile }: { isMobile: boolean }) => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section id="features" style={{
      maxWidth: 1180, margin: '0 auto',
      padding: isMobile ? '64px 20px 32px' : '96px 28px 48px',
    }}>
      <div style={{ marginBottom: isMobile ? 36 : 56, maxWidth: 580 }}>
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: 14,
        }}>
          Что внутри
        </div>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? 'clamp(28px, 7vw, 36px)' : 'clamp(38px, 4vw, 50px)',
          fontWeight: 800, letterSpacing: '-0.035em',
          lineHeight: 1.05, color: 'var(--text)',
        }}>
          Только то, чем действительно пользуешься.
        </h2>
        <p style={{
          margin: '16px 0 0', maxWidth: 480,
          fontSize: 15, color: 'var(--dim)', lineHeight: 1.55,
        }}>
          Никаких фейковых ачивок и баннеров «купи премиум».
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr',
        gap: isMobile ? 14 : 18,
      }}>
        {/* Большая карточка слева */}
        <FeatureCard
          {...FEATURES[0]}
          onMouseMove={handleMouseMove}
          large
        />

        {/* Правая колонка из 3 маленьких */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: isMobile ? 14 : 18,
        }}>
          {FEATURES.slice(1).map((f, i) => (
            <FeatureCard key={i} {...f} onMouseMove={handleMouseMove} />
          ))}
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  title: string; desc: string; icon: React.ReactNode; accent: string;
  visual: 'grid' | 'chat' | 'list' | 'export';
  large?: boolean;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
}
const FeatureCard = ({ title, desc, icon, accent, visual, large, onMouseMove }: FeatureCardProps) => (
  <div
    className="lp-feature-card"
    onMouseMove={onMouseMove}
    style={{
      position: 'relative',
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: 24,
      padding: large ? 26 : 22,
      minHeight: large ? 360 : 'auto',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 6px 20px rgba(0,0,0,0.12)',
    }}
  >
    <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'inline-flex',
        width: 42, height: 42, borderRadius: 12,
        background: `color-mix(in oklab, ${accent} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${accent} 25%, transparent)`,
        color: accent,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: large ? 20 : 14,
      }}>
        {icon}
      </div>

      <h3 style={{
        margin: 0,
        fontSize: large ? 22 : 17,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--text)',
        lineHeight: 1.2,
      }}>
        {title}
      </h3>
      <p style={{
        margin: '8px 0 0',
        fontSize: large ? 14.5 : 13.5,
        color: 'var(--dim)',
        lineHeight: 1.55,
        maxWidth: large ? 380 : '100%',
      }}>
        {desc}
      </p>

      {/* Визуал внизу карточки */}
      <div style={{ flex: 1, minHeight: large ? 140 : 80, marginTop: large ? 22 : 16, display: 'flex', alignItems: 'flex-end' }}>
        {visual === 'grid' && <BentoVisualGrid />}
        {visual === 'list' && <BentoVisualList accent={accent} />}
        {visual === 'chat' && <BentoVisualChat accent={accent} />}
        {visual === 'export' && <BentoVisualExport accent={accent} />}
      </div>
    </div>
  </div>
);

// ── Визуал 1: активити-грид (для большой карточки) ────────────────────
const BentoVisualGrid = () => {
  const pattern = [0, 1, 0, 2, 1, 0, 0, 1, 0, 1, 0, 2, 1, 0, 0, 2, 1, 0, 1, 0, 0, 1, 0, 2, 1, 0, 0, 1];
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: 'var(--ghost)',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 8, letterSpacing: '0.06em',
      }}>
        <span>4 недели</span>
        <span>+12 трен.</span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
      }}>
        {pattern.map((c, i) => (
          <div key={i} style={{
            aspectRatio: '1 / 1',
            borderRadius: 5,
            background: c === 0
              ? 'var(--surface2)'
              : c === 1
                ? 'var(--accent-a25)'
                : 'var(--accent)',
            border: c > 0 ? '1px solid var(--accent-a30)' : '1px solid var(--border)',
          }} />
        ))}
      </div>
    </div>
  );
};

// ── Визуал 2: список упражнений ──────────────────────────────────────
const BentoVisualList = ({ accent }: { accent: string }) => (
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
    {[
      'Приседания со штангой',
      'Жим лёжа',
      'Становая тяга',
    ].map((name, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 11, color: 'var(--text3)',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: 4,
          background: `color-mix(in oklab, ${accent} 18%, transparent)`,
        }} />
        <span style={{ flex: 1, fontWeight: 500 }}>{name}</span>
        <span style={{ color: 'var(--ghost)', fontSize: 9.5,
          fontFamily: 'JetBrains Mono, monospace' }}>{4 + i}×{8 + i}</span>
      </div>
    ))}
  </div>
);

// ── Визуал 3: чат с ИИ ────────────────────────────────────────────────
const BentoVisualChat = ({ accent }: { accent: string }) => (
  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
    <div style={{
      alignSelf: 'flex-end',
      maxWidth: '85%',
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: '12px 12px 4px 12px',
      padding: '6px 10px',
      fontSize: 10.5, color: 'var(--text3)',
      lineHeight: 1.4,
    }}>
      Хочу нарастить массу
    </div>
    <div style={{
      alignSelf: 'flex-start',
      maxWidth: '85%',
      background: `color-mix(in oklab, ${accent} 10%, var(--surface2))`,
      border: `1px solid color-mix(in oklab, ${accent} 25%, transparent)`,
      borderRadius: '12px 12px 12px 4px',
      padding: '6px 10px',
      fontSize: 10.5, color: 'var(--text3)',
      lineHeight: 1.4,
      display: 'flex', gap: 5, alignItems: 'flex-start',
    }}>
      <span style={{ color: accent, marginTop: 2, flexShrink: 0 }}><IconSparkle s={11} /></span>
      <span>Составил план на 4 недели</span>
    </div>
  </div>
);

// ── Визуал 4: файл экспорта ───────────────────────────────────────────
const BentoVisualExport = ({ accent }: { accent: string }) => (
  <div style={{ width: '100%' }}>
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 10,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 9.5, lineHeight: 1.5,
      color: 'var(--dim)',
    }}>
      <div style={{ color: 'var(--ghost)' }}># workouts_2026-05-21.txt</div>
      <div><span style={{ color: accent }}>14 мая</span> · Грудь, спина · 6 упр</div>
      <div><span style={{ color: accent }}>16 мая</span> · Ноги · 5 упр</div>
      <div><span style={{ color: 'var(--ghost)' }}>...</span></div>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════
// How it works
// ════════════════════════════════════════════════════════════════════════
const STEPS = [
  {
    n: '01',
    title: 'Зарегистрируйся',
    desc: 'Минута. Логин, пароль, цель. Никаких карт.',
  },
  {
    n: '02',
    title: 'Запиши тренировку',
    desc: 'Выбери упражнения из базы или добавь свои. Подходы, вес, время — всё гибко.',
  },
  {
    n: '03',
    title: 'Смотри прогресс',
    desc: 'Активность за месяц, график по неделям, и общайся с ИИ-тренером когда нужно.',
  },
];

const HowItWorksSection = ({ isMobile }: { isMobile: boolean }) => (
  <section style={{
    maxWidth: 1180, margin: '0 auto',
    padding: isMobile ? '48px 20px 48px' : '72px 28px 80px',
  }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
      gap: isMobile ? 28 : 80,
      alignItems: 'flex-start',
    }}>
      <div>
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          marginBottom: 14,
        }}>
          Как начать
        </div>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? 'clamp(28px, 7vw, 34px)' : 'clamp(34px, 3.5vw, 44px)',
          fontWeight: 800, letterSpacing: '-0.035em',
          lineHeight: 1.05, color: 'var(--text)',
        }}>
          Три шага до первой тренировки.
        </h2>
        <p style={{
          margin: '16px 0 0',
          fontSize: 14.5, color: 'var(--dim)', lineHeight: 1.55,
        }}>
          Без обучающих экранов на 10 свайпов. Без рассылок на почту.
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        {STEPS.map((step, i) => (
          <div key={step.n} style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr',
            gap: 18,
            paddingBottom: i === STEPS.length - 1 ? 0 : 28,
            position: 'relative',
            animation: 'lp-stepIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: `${i * 100}ms`,
          }}>
            {/* Номер + пунктирная линия снизу */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13, fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
              }}>
                {step.n}
              </div>
              {i < STEPS.length - 1 && (
                <div className="lp-step-line" style={{
                  flex: 1, minHeight: 36, width: 1,
                }} />
              )}
            </div>

            <div style={{ paddingTop: 8 }}>
              <h3 style={{
                margin: 0,
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
              }}>
                {step.title}
              </h3>
              <p style={{
                margin: '6px 0 0',
                fontSize: 14, color: 'var(--dim)',
                lineHeight: 1.55, maxWidth: 480,
              }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════════════
// Final CTA
// ════════════════════════════════════════════════════════════════════════
const FinalCta = ({ onClick }: { onClick: () => void }) => (
  <section style={{
    maxWidth: 1180, margin: '0 auto',
    padding: '20px 20px 80px',
  }}>
    <div style={{
      position: 'relative',
      borderRadius: 28,
      padding: 'clamp(48px, 8vw, 80px) clamp(28px, 5vw, 64px)',
      background:
        'radial-gradient(circle at 80% 20%, var(--accent-a20), transparent 50%), ' +
        'radial-gradient(circle at 20% 80%, var(--accent-a12), transparent 50%), ' +
        'var(--surface)',
      border: '1px solid var(--accent-a20)',
      overflow: 'hidden',
      textAlign: 'center',
      boxShadow: '0 20px 60px -20px rgba(0,0,0,0.4)',
    }}>
      {/* Декоративная сетка */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'linear-gradient(var(--border) 1px, transparent 1px), ' +
          'linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.4,
        maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px 6px 8px',
          background: 'var(--bg)',
          border: '1px solid var(--border2)',
          borderRadius: 999,
          fontSize: 12, color: 'var(--muted)', fontWeight: 500,
          marginBottom: 24,
        }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--accent-a20)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconChartBar s={10} />
          </span>
          <span>1 минута до первой записи</span>
        </div>

        <h2 style={{
          margin: '0 0 16px',
          fontSize: 'clamp(28px, 5vw, 44px)',
          fontWeight: 800, letterSpacing: '-0.035em',
          lineHeight: 1.08, color: 'var(--text)',
          maxWidth: 620, marginLeft: 'auto', marginRight: 'auto',
        }}>
          Хватит держать тренировки в голове.
        </h2>
        <p style={{
          margin: '0 auto 32px',
          maxWidth: 460,
          fontSize: 15.5, color: 'var(--dim)',
          lineHeight: 1.55,
        }}>
          Запиши первую через минуту. Дашборд оживёт сразу.
        </p>

        <button
          onClick={onClick}
          className="lp-press lp-cta-primary"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '16px 30px',
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
            color: 'var(--accent-fg)',
            fontWeight: 700, fontSize: 15.5,
            cursor: 'pointer',
            boxShadow: '0 12px 36px var(--accent-a30), inset 0 1px 0 rgba(255,255,255,0.2)',
            letterSpacing: '-0.005em',
          }}
        >
          Зарегистрироваться — бесплатно
          <IconArrowRight s={15} />
        </button>

        <div style={{
          marginTop: 22, fontSize: 12.5, color: 'var(--ghost)',
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: 14,
        }}>
          {[
            'без карты',
            'без подписок',
            'без рекламы',
          ].map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}><IconCheck s={11} /></span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════════════
// Footer
// ════════════════════════════════════════════════════════════════════════
const FooterSection = () => (
  <footer style={{
    borderTop: '1px solid var(--border)',
    padding: '28px 24px',
    textAlign: 'center',
  }}>
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7,
          background: 'var(--accent-a12)',
          color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconDumbbell s={12} />
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>
          GymLog · студенческий проект
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ghost)',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
        MVP v0.1
      </div>
    </div>
  </footer>
);

