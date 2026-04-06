import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const SIDEBAR_WIDTH = 220;

const IconHome = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3l9 9" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconDumbbell = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
      stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconBook = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 1 4 17.5V4.5z"
      stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTimer = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="13" r="8" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8"/>
    <path d="M12 9v4l2.5 2.5" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9.5 3h5M12 3v2" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconUser = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconSettings = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const NAV_ITEMS = [
  { to: '/',          label: 'Главная',      icon: (a: boolean) => <IconHome active={a} />,     end: true  },
  { to: '/workouts',  label: 'Тренировки',   icon: (a: boolean) => <IconDumbbell active={a} />, end: false },
  { to: '/knowledge', label: 'База знаний',  icon: (a: boolean) => <IconBook active={a} />,     end: false },
  { to: '/timer',     label: 'Таймер',       icon: (a: boolean) => <IconTimer active={a} />,    end: false },
  { to: '/profile',   label: 'Профиль',      icon: (a: boolean) => <IconUser active={a} />,     end: false },
  { to: '/settings',  label: 'Настройки',    icon: (a: boolean) => <IconSettings active={a} />, end: false },
];

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: 'rgba(110,231,183,0.12)',
      border: '1px solid rgba(110,231,183,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
          stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <div>
      <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>GymLog</div>
      <div style={{ color: '#475569', fontSize: 11, marginTop: 1 }}>трекер тренировок</div>
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        body { margin: 0; background: #111318; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .nav-link { text-decoration: none; display: block; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#111318' }}>

        {/* ── Десктоп: левый сайдбар ── */}
        {!isMobile && (
          <aside style={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            flexShrink: 0,
            background: '#1a1d24',
            borderRight: '1px solid rgba(255,255,255,0.07)',
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
                color: '#334155', fontSize: 10, fontWeight: 600,
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
                      background: isActive ? 'rgba(110,231,183,0.1)' : 'transparent',
                      marginBottom: 2, transition: 'background 0.15s',
                      cursor: 'pointer',
                    }}>
                      {icon(isActive)}
                      <span style={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#6ee7b7' : '#94a3b8',
                      }}>
                        {label}
                      </span>
                      {isActive && (
                        <div style={{
                          marginLeft: 'auto', width: 6, height: 6,
                          borderRadius: '50%', background: '#6ee7b7',
                        }} />
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </nav>

            <div style={{ padding: '0 18px', color: '#334155', fontSize: 11 }}>MVP v0.1</div>
          </aside>
        )}

        {/* ── Основной контент ── */}
        <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 64 : 0 }}>
          <Outlet />
        </main>
      </div>

      {/* ── Мобила: нижний таббар (только иконки) ── */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(17,19,24,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex',
        }}>
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-link" style={{ flex: 1 }}>
              {({ isActive }) => (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 3, padding: '10px 0',
                  cursor: 'pointer',
                }}>
                  {icon(isActive)}
                  {/* Подпись только для активного пункта */}
                  {isActive && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: '#6ee7b7',
                      letterSpacing: '0.02em',
                    }}>
                      {label}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
};