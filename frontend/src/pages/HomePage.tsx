import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: '🏋️',
    title: 'Тренировки',
    desc: 'Ведите дневник, отслеживайте прогресс по весу и повторениям.',
    to: '/workouts',
    color: 'rgba(110,231,183,0.08)',
    border: 'rgba(110,231,183,0.2)',
  },
  {
    icon: '⏱️',
    title: 'Таймер',
    desc: 'Таймер отдыха между подходами и секундомер — всё как на iPhone.',
    to: '/timer',
    color: 'rgba(99,179,237,0.08)',
    border: 'rgba(99,179,237,0.2)',
  },
  {
    icon: '👤',
    title: 'Профиль',
    desc: 'Ваши личные данные, статистика и история тренировок.',
    to: '/profile',
    color: 'rgba(196,181,253,0.08)',
    border: 'rgba(196,181,253,0.2)',
  },
  {
    icon: '⚙️',
    title: 'Настройки',
    desc: 'Уведомления, единицы измерения и другие параметры.',
    to: '/settings',
    color: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
  },
];

const stats = [
  { value: '0', label: 'тренировок' },
  { value: '0', label: 'упражнений' },
  { value: '0 кг', label: 'тоннаж' },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111318',
      color: '#f1f5f9',
      padding: '48px 24px 80px',
      maxWidth: 720,
      margin: '0 auto',
    }}>

      {/* Hero */}
      <div style={{ marginBottom: 56, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(110,231,183,0.12)',
          border: '1px solid rgba(110,231,183,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 28,
        }}>
          💪
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          margin: '0 0 16px',
          lineHeight: 1.15,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #6ee7b7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Добро пожаловать<br />в GymLog
        </h1>

        <p style={{
          color: '#64748b',
          fontSize: 16,
          lineHeight: 1.6,
          maxWidth: 420,
          margin: '0 auto 32px',
        }}>
          Умный дневник тренировок с прогрессивной перегрузкой,
          аналитикой и таймером отдыха.
        </p>

        <button
          onClick={() => navigate('/workouts')}
          style={{
            padding: '14px 32px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
            border: 'none',
            color: '#052e16',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Начать тренировку →
        </button>
      </div>

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 48,
      }}>
        {stats.map(({ value, label }) => (
          <div key={label} style={{
            background: '#1a1d24',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '20px 12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#6ee7b7' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Карточки разделов */}
      <div>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#334155',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
        }}>
          Разделы
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {features.map(({ icon, title, desc, to, color, border }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              style={{
                background: color,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};