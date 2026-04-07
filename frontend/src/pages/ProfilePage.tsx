import { useState } from 'react';

interface ProfileData {
  name: string;
  age: string;
  weight: string;
  height: string;
}

const statItems = [
  { label: 'Тренировок', value: '0' },
  { label: 'Этот месяц', value: '0' },
  { label: 'Серия дней', value: '0' },
];

const FIELD_LABELS: Record<keyof ProfileData, string> = {
  name: 'Имя',
  age: 'Возраст',
  weight: 'Вес (кг)',
  height: 'Рост (см)',
};

export const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(() => {
    try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        return {
          name: u.username || '',
          age: u.age?.toString() || '',
          weight: u.weight?.toString() || '',
          height: u.height?.toString() || '',
      };
    } catch { return { name: '', age: '', weight: '', height: '' }; }
  });
  const [draft, setDraft] = useState<ProfileData>(profile);

  const handleEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(draft);
    setIsEditing(false);
    // TODO: сохранить в localStorage / отправить на API
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#111318', color: '#f1f5f9',
      padding: '48px 24px', maxWidth: 600, margin: '0 auto',
    }}>

      {/* Аватар */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(110,231,183,0.12)',
          border: '2px solid rgba(110,231,183,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 16,
        }}>
          👤
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>
          {profile.name || 'Ваш профиль'}
        </h2>
        <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Личные данные и статистика</p>
      </div>

      {/* Статистика */}
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

      {/* Личные данные */}
      <div style={{
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
        }}>
          <div style={{
            color: '#334155', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Личные данные
          </div>

          {!isEditing ? (
            <button
              onClick={handleEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: 'rgba(110,231,183,0.1)',
                color: '#6ee7b7', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.1)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Редактировать
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
                  color: '#052e16', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Сохранить
              </button>
            </div>
          )}
        </div>

        {(Object.keys(FIELD_LABELS) as (keyof ProfileData)[]).map((field, i, arr) => (
          <div key={field} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0',
            borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{FIELD_LABELS[field]}</span>

            {isEditing ? (
              <input
                type={field === 'name' ? 'text' : 'number'}
                value={draft[field]}
                onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
                placeholder="—"
                style={{
                  background: '#21252e', color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 10px',
                  fontSize: 14, outline: 'none', width: 120,
                  textAlign: 'right',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(110,231,183,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            ) : (
              <span style={{ color: profile[field] ? '#f1f5f9' : '#334155', fontSize: 14 }}>
                {profile[field] || '— не указано'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};