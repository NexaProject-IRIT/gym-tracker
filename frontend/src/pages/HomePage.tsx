import { useNavigate } from 'react-router-dom';

const IconDumbbell = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"/>
  </svg>
);

const IconBook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#63b3ed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
);

const IconChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconWorkouts = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"/>
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20v-1a8 8 0 0116 0v1"/>
  </svg>
);
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconTrend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const features = [
  {
    icon: <IconDumbbell />,
    title: 'Тренировки',
    desc: 'Ведите дневник, добавляйте упражнения из базы или свои, отслеживайте прогресс по весу и повторениям.',
    to: '/workouts',
    color: 'rgba(110,231,183,0.08)',
    border: 'rgba(110,231,183,0.2)',
    accent: '#6ee7b7',
  },
  {
    icon: <IconBook />,
    title: 'База упражнений',
    desc: 'Справочник упражнений с описанием техники, целевыми мышцами и фото. Фильтры по группам мышц.',
    to: '/knowledge',
    color: 'rgba(99,179,237,0.08)',
    border: 'rgba(99,179,237,0.2)',
    accent: '#63b3ed',
  },
  {
    icon: <IconChart />,
    title: 'Статистика',
    desc: 'Количество тренировок, объём за месяц и динамика нагрузки — всё в профиле.',
    to: '/profile',
    color: 'rgba(196,181,253,0.08)',
    border: 'rgba(196,181,253,0.2)',
    accent: '#c4b5fd',
  },
];

const steps = [
  { icon: <IconUser />, title: 'Создайте аккаунт', desc: 'Укажите параметры тела и выберите цель — похудение, набор мышц или выносливость.' },
  { icon: <IconPlus />, title: 'Добавьте тренировку', desc: 'Выберите тип, добавьте упражнения из базы или создайте свои. Поддержка подходов, веса, времени.' },
  { icon: <IconTrend />, title: 'Следите за прогрессом', desc: 'Смотрите статистику в профиле, экспортируйте историю тренировок.' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Hero */}
      <div style={{ padding: '80px 24px 72px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--accent-a12)',
          border: '1px solid var(--accent-a25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          <IconWorkouts />
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)',
          fontWeight: 800,
          margin: '0 0 18px',
          lineHeight: 1.12,
          background: 'linear-gradient(135deg, var(--text) 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Умный дневник<br />тренировок
        </h1>

        <p style={{ color: 'var(--dim)', fontSize: 17, lineHeight: 1.65, maxWidth: 440, margin: '0 auto 36px' }}>
          Записывайте тренировки, отслеживайте прогресс и пользуйтесь базой упражнений — всё в одном месте.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(isLoggedIn ? '/workouts' : '/register')}
            style={{
              padding: '14px 32px', borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none', color: 'var(--accent-fg)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Начать →
          </button>
          <button
            onClick={() => navigate('/workouts')}
            style={{
              padding: '14px 28px', borderRadius: 14,
              background: 'transparent',
              border: '1px solid var(--border3)',
              color: 'var(--muted)', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-a30)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border3)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Открыть тренировки
          </button>
        </div>
      </div>

      {/* Три основные функции */}
      <div style={{ padding: '0 24px 72px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--ghost)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          textAlign: 'center', marginBottom: 32,
        }}>
          Что умеет GymLog
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {features.map(({ icon, title, desc, to, color, border, accent }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                background: color,
                border: `1px solid ${border}`,
                borderRadius: 18,
                padding: '22px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 28px ${border}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${accent}18`,
                border: `1px solid ${accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Как начать */}
      <div style={{
        padding: '56px 24px 72px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--ghost)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textAlign: 'center', marginBottom: 8,
          }}>
            Как начать
          </div>
          <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 40px' }}>
            Три шага до первой тренировки
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 18, padding: '24px 20px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontSize: 11, fontWeight: 800, color: 'var(--ghost)',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'var(--accent-a10)',
                  border: '1px solid var(--accent-a20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)', marginBottom: 16,
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.55 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Промо-блок */}
      <div style={{ padding: '72px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--accent-a10)',
          border: '1px solid var(--accent-a20)',
          borderRadius: 24, padding: '48px 32px',
        }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px', lineHeight: 1.2 }}>
            Начните уже сегодня
          </h2>
          <p style={{ color: 'var(--dim)', fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 32px' }}>
            Регистрация займёт меньше минуты. Первая тренировка — сразу после.
          </p>
          <button
            onClick={() => navigate(isLoggedIn ? '/workouts' : '/register')}
            style={{
              padding: '14px 36px', borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none', color: 'var(--accent-fg)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Попробовать →
          </button>
        </div>
      </div>

    </div>
  );
};
