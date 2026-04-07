import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  name: string;
  age: string;
  weight: string;
  height: string;
}

const FIELD_LABELS: Record<keyof ProfileData, string> = {
  name: 'Имя',
  age: 'Возраст',
  weight: 'Вес (кг)',
  height: 'Рост (см)',
};

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ name: '', age: '', weight: '', height: '' });
  const [draft, setDraft] = useState<ProfileData>(profile);

  // Загрузить профиль с API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/auth/profile/', {
          headers: { Authorization: `Token ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          const p: ProfileData = {
            name: data.username || '',
            age: data.age?.toString() || '',
            weight: data.weight?.toString() || '',
            height: data.height?.toString() || '',
          };
          setProfile(p);
          setDraft(p);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch {
        // Fallback to localStorage
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          const p: ProfileData = {
            name: u.username || '',
            age: u.age?.toString() || '',
            weight: u.weight?.toString() || '',
            height: u.height?.toString() || '',
          };
          setProfile(p);
          setDraft(p);
        } catch {}
      }
    };
    loadProfile();
  }, []);

  const handleEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (draft.name) body.username = draft.name;
      if (draft.height) body.height = parseFloat(draft.height);
      if (draft.weight) body.weight = parseFloat(draft.weight);
      if (draft.age) body.age = parseInt(draft.age);

      const res = await fetch('/auth/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const p: ProfileData = {
          name: data.username || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
        };
        setProfile(p);
        setDraft(p);
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch {}
    setSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/export/', {
        headers: { Authorization: `Token ${getToken()}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workouts_export_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {}
    setExporting(false);
  };

  const handleLogout = () => {
    fetch('/auth/logout/', {
      method: 'POST',
      headers: { Authorization: `Token ${getToken()}` },
    }).catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const statItems = [
    { label: 'Тренировок', value: '—' },
    { label: 'Этот месяц', value: '—' },
    { label: 'Серия дней', value: '—' },
  ];

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
        <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Личные данные и настройки</p>
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
        borderRadius: 16, padding: 24, marginBottom: 16,
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
                disabled={saving}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none',
                  background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
                  color: '#052e16', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Сохраняем...' : 'Сохранить'}
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

      {/* Экспорт тренировок */}
      <div style={{
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24, marginBottom: 16,
      }}>
        <div style={{
          color: '#334155', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16,
        }}>
          Данные
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: 'rgba(110,231,183,0.1)',
            color: '#6ee7b7', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
            opacity: exporting ? 0.6 : 1,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(110,231,183,0.1)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {exporting ? 'Экспорт...' : 'Экспорт тренировок (.txt)'}
        </button>
      </div>

      {/* Выход */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          border: '1px solid rgba(248,113,113,0.3)',
          background: 'rgba(248,113,113,0.08)',
          color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
      >
        Выйти из аккаунта
      </button>

      <div style={{ textAlign: 'center', marginTop: 32, color: '#1e293b', fontSize: 12 }}>
        GymLog MVP v0.1
      </div>
    </div>
  );
};
