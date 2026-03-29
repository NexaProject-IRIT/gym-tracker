const settingGroups = [
  {
    title: 'Общие',
    items: ['Язык интерфейса', 'Единицы измерения (кг / фунты)', 'Тема оформления'],
  },
  {
    title: 'Уведомления',
    items: ['Напоминания о тренировках', 'Напоминание об утреннем весе', 'Push-уведомления'],
  },
  {
    title: 'Данные',
    items: ['Экспорт тренировок', 'Очистить историю', 'О приложении'],
  },
];

export const SettingsPage = () => (
  <div style={{
    minHeight: '100vh', background: '#111318', color: '#f1f5f9',
    padding: '48px 24px', maxWidth: 600, margin: '0 auto',
  }}>
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Настройки</h2>
      <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Параметры приложения</p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {settingGroups.map(({ title, items }) => (
        <div key={title} style={{
          background: '#1a1d24',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 20px',
            color: '#334155', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {title}
          </div>
          {items.map((item, i) => (
            <div
              key={item}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px',
                borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
              <span style={{ color: '#334155', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      ))}
    </div>

    <div style={{ textAlign: 'center', marginTop: 40, color: '#1e293b', fontSize: 12 }}>
      GymLog MVP v0.1
    </div>
  </div>
);