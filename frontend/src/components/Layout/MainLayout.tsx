import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AiChatProvider } from '../../contexts/AiChatContext';
import { WorkoutsProvider } from '../../contexts/WorkoutsContext';
import { FloatingTimer } from '../Timer/FloatingTimer';

const SIDEBAR_WIDTH = 220;

const IconHome = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3l9 9" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDumbbell = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
      stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBook = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 1 4 17.5V4.5z"
      stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUser = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconAi = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v8A2.5 2.5 0 0117.5 16H13l-4 4v-4H6.5A2.5 2.5 0 014 13.5v-8z"
      stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="9.5" r="1" fill={active ? 'var(--accent)' : 'var(--dim)'}/>
    <circle cx="12" cy="9.5" r="1" fill={active ? 'var(--accent)' : 'var(--dim)'}/>
    <circle cx="15" cy="9.5" r="1" fill={active ? 'var(--accent)' : 'var(--dim)'}/>
  </svg>
);

const IconAnalytics = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 3v18h18"
      stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14l4-4 3 3 5-6"
      stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

type NavItem = {
  to: string;
  label: string;        // отображается в десктоп-сайдбаре
  mobileLabel?: string; // более короткая версия для мобильного таб-бара (по необходимости)
  icon: (a: boolean) => React.ReactNode;
  end: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/',          label: 'Главная',         icon: (a) => <IconHome active={a} />,     end: true  },
  { to: '/workouts',  label: 'Тренировки',      icon: (a) => <IconDumbbell active={a} />, end: false },
  { to: '/analytics', label: 'Аналитика',       icon: (a) => <IconAnalytics active={a} />, end: false },
  { to: '/ai',        label: 'ИИ-тренер',       icon: (a) => <IconAi active={a} />,       end: false },
  { to: '/knowledge', label: 'База тренировок', mobileLabel: 'База', icon: (a) => <IconBook active={a} />, end: false },
  { to: '/profile',   label: 'Профиль',         icon: (a) => <IconUser active={a} />,     end: false },
];

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'var(--accent-a12)',
      border: '1px solid var(--accent-a20)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
          stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <div>
      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>GymLog</div>
      <div style={{ color: 'var(--ghost)', fontSize: 11, marginTop: 1 }}>трекер тренировок</div>
    </div>
  </div>
);

export const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; }
        .nav-link { text-decoration: none; display: block; }
      `}</style>

      <WorkoutsProvider>
      <AiChatProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

          {/* Десктоп: левый сайдбар */}
          {!isMobile && (
            <aside style={{
              width: SIDEBAR_WIDTH,
              minWidth: SIDEBAR_WIDTH,
              flexShrink: 0,
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 0 24px',
              position: 'sticky',
              top: 0,
              height: '100vh',
              zIndex: 10,
              alignSelf: 'flex-start',
            }}>
              <div style={{ padding: '0 18px 28px' }}>
                <Logo />
              </div>

              <nav style={{ flex: 1, padding: '0 10px' }}>
                <div style={{
                  color: 'var(--ghost)', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '0 8px', marginBottom: 6,
                }}>
                  Меню
                </div>

                {NAV_ITEMS.map(({ to, label, icon, end }) => (
                  <NavLink key={to} to={to} end={end} className="nav-link">
                    {({ isActive }) => (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: isActive ? 'var(--accent-a10)' : 'transparent',
                        marginBottom: 2, transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}>
                        {icon(isActive)}
                        <span style={{
                          fontSize: 14,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'var(--accent)' : 'var(--muted)',
                        }}>
                          {label}
                        </span>
                        {isActive && (
                          <div style={{
                            marginLeft: 'auto', width: 6, height: 6,
                            borderRadius: '50%', background: 'var(--accent)',
                          }} />
                        )}
                      </div>
                    )}
                  </NavLink>
                ))}
              </nav>

              <div style={{
                padding: '0 18px 6px',
                color: 'var(--ghost)', fontSize: 11,
                textAlign: 'center',
              }}>
                MVP v0.1
              </div>
            </aside>
          )}

          {/* Основной контент */}
          <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 68 : 0 }}>
            <Outlet />
          </main>
        </div>

        {/* Мобила: нижний таббар */}
        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            borderTop: '1px solid var(--border)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            display: 'flex',
            alignItems: 'stretch',
          }}>
            {NAV_ITEMS.map(({ to, label, mobileLabel, icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-link" style={{ flex: 1, minWidth: 0 }}>
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 4, padding: '8px 4px 6px',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}>
                    {icon(isActive)}
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent)' : 'var(--dim)',
                      letterSpacing: '-0.005em',
                      lineHeight: 1.1,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'color 0.15s',
                    }}>
                      {mobileLabel ?? label}
                    </span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        )}

        <FloatingTimer isMobile={isMobile} />
      </AiChatProvider>
      </WorkoutsProvider>
    </>
  );
};
