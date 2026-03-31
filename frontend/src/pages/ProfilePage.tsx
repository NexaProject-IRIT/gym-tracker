const statItems = [
  { label: 'Тренировок', value: '0' },
  { label: 'Этот месяц', value: '0' },
  { label: 'Серия дней', value: '0' },
];

export const ProfilePage = () => (
  <div style={{
    minHeight: '100vh', background: '#111318', color: '#f1f5f9',
    padding: '48px 24px', maxWidth: 600, margin: '0 auto',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(110,231,183,0.12)',
        border: '2px solid rgba(110,231,183,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginBottom: 16,
      }}>
        
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Ваш профиль</h2>
      <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Личные данные и статистика</p>
    </div>

    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12, marginBottom: 32,
    }}>
      {statItems.map(({ label, value }) => (
        <div key={label} style={{
          background: '#1a1d24',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '20px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#6ee7b7' }}>{value}</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>

    <div style={{
      background: '#1a1d24',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{
        color: '#334155', fontSize: 11, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
      }}>
        Личные данные
      </div>
      {['Имя', 'Возраст', 'Вес', 'Рост'].map((field, i, arr) => (
        <div key={field} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0',
          borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>{field}</span>
          <span style={{ color: '#334155', fontSize: 14 }}>— скоро</span>
        </div>
      ))}
    </div>
  </div>
);