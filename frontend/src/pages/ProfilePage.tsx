import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NumberInput } from '../components/UI/NumberInput';
import { authedFetch, clearTokens } from '../utils/api';

// Enum строго из бэка (profiles/models.py GOAL_CHOICES)
type Goal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'recomposition'
  | 'improve_endurance'
  | 'increase_strength'
  | 'maintain';

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'Похудение',
  gain_muscle: 'Набор мышц',
  recomposition: 'Рекомпозиция',
  improve_endurance: 'Выносливость',
  increase_strength: 'Сила',
  maintain: 'Поддержание формы',
};

const GOAL_OPTIONS = Object.entries(GOAL_LABELS) as [Goal, string][];

interface ProfileData {
  username: string;
  displayName: string;
  age: string;
  weight: string;
  height: string;
  goal: Goal | '';
}

interface Stats {
  total: number;
  this_month: number;
}



function formatWorkouts(n: number): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return `${n} тренировок`;
  if (mod10 === 1) return `${n} тренировка`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} тренировки`;
  return `${n} тренировок`;
}

const IconPerson = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="3" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 21v-1a7 7 0 0114 0v1" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ConfirmModal = ({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  }}>
    <div style={{
      background: '#1a1d24', borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: 28, maxWidth: 360, width: '100%',
    }}>
      <p style={{ color: '#f1f5f9', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
          color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Отмена</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '12px', borderRadius: 12, border: 'none',
          background: 'rgba(248,113,113,0.15)',
          color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Удалить</button>
      </div>
    </div>
  </div>
);

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ username: '', displayName: '', age: '', weight: '', height: '', goal: '' });
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, this_month: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readProfileFromResponse = (data: any): ProfileData => ({
    username: data.username ?? '',
    displayName: data.display_name ?? data.username ?? '',
    age: data.age != null ? String(data.age) : '',
    weight: data.weight != null ? String(data.weight) : '',
    height: data.height != null ? String(data.height) : '',
    goal: (data.goal as Goal) || '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authedFetch('/auth/profile/');
        if (res.ok) {
          const data = await res.json();
          const p = readProfileFromResponse(data);
          setProfile(p);
          setDraft(p);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          const p = readProfileFromResponse(u);
          setProfile(p);
          setDraft(p);
        } catch { /* ignore */ }
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await authedFetch('/workouts/stats/');
        if (res.ok) {
          const data = await res.json();
          setStats({ total: data.total ?? 0, this_month: data.this_month ?? 0 });
          setStatsLoaded(true);
        }
      } catch { /* оставляем statsLoaded=false, в плашках будет «—» */ }
    };
    loadStats();
  }, []);

  const handleEdit = () => { setDraft(profile); setSaveError(null); setUsernameError(null); setIsEditing(true); };

  const handleSave = async () => {
    setUsernameError(null);
    if (!draft.username.trim() || draft.username.trim().length < 3) {
      setUsernameError('Минимум 3 символа');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {};
      if (draft.username !== profile.username) body.username = draft.username.trim();
      if (draft.displayName !== profile.displayName) body.display_name = draft.displayName;
      if (draft.height) body.height = parseFloat(draft.height);
      if (draft.weight) body.weight = parseFloat(draft.weight);
      if (draft.age) body.age = parseInt(draft.age);
      if (draft.goal) body.goal = draft.goal;

      const res = await authedFetch('/auth/profile/', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const p = readProfileFromResponse(data);
        setProfile(p);
        setDraft(p);
        localStorage.setItem('user', JSON.stringify(data));
        setIsEditing(false);
      } else {
        const err = await res.json().catch(() => ({}));
        if (err.username?.[0]) {
          setUsernameError(err.username[0]);
          return;
        }
        const firstKey = Object.keys(err)[0];
        setSaveError(firstKey ? String(Array.isArray(err[firstKey]) ? err[firstKey][0] : err[firstKey]) : `Ошибка ${res.status}`);
      }
    } catch {
      setSaveError('Нет связи с сервером');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { setDraft(profile); setSaveError(null); setUsernameError(null); setIsEditing(false); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await authedFetch('/export/');
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
    } catch { /* ignore */ }
    setExporting(false);
  };

  const handleClearHistory = async () => {
    setShowClearConfirm(false);
    setClearing(true);
    try {
      const res = await authedFetch('/workouts/clear/', {
        method: 'DELETE',
      });
      if (res.ok) setStats({ total: 0, this_month: 0 });
    } catch { /* ignore */ }
    setClearing(false);
  };

  const handleLogout = () => {
    authedFetch('/auth/logout/', { method: 'POST' }).catch(() => {});
    clearTokens();
    navigate('/login');
  };

  const statItems = [
    { label: 'Тренировок', value: statsLoaded ? formatWorkouts(stats.total) : '—' },
    { label: 'Этот месяц', value: statsLoaded ? String(stats.this_month) : '—' },
  ];

  type NumericField = 'age' | 'weight' | 'height';
  const numericFields: { field: NumericField; label: string; step: number; min: number; max: number }[] = [
    { field: 'age',    label: 'Возраст',  step: 1,   min: 10, max: 120 },
    { field: 'weight', label: 'Вес (кг)', step: 0.5, min: 20, max: 500 },
    { field: 'height', label: 'Рост (см)', step: 1,  min: 50, max: 280 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#111318', color: '#f1f5f9', padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(110,231,183,0.12)',
          border: '2px solid rgba(110,231,183,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <IconPerson />
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{profile.displayName || profile.username || 'Ваш профиль'}</h2>
        <p style={{ margin: '0 0 2px', color: '#475569', fontSize: 13 }}>@{profile.username}</p>
        <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>Личные данные и настройки</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
        {statItems.map(({ label, value }) => (
          <div key={label} style={{
            background: '#1a1d24', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '20px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#6ee7b7' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: '#334155', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Личные данные
          </div>
          {!isEditing ? (
            <button onClick={handleEdit} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, border: 'none',
              background: 'rgba(110,231,183,0.1)', color: '#6ee7b7', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Редактировать
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCancel} style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Отмена</button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none',
                background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
                color: '#052e16', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1,
              }}>{saving ? 'Сохраняем...' : 'Сохранить'}</button>
            </div>
          )}
        </div>

        {saveError && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 12,
          }}>
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Логин</span>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <input type="text" value={draft.username} onChange={e => setDraft(d => ({ ...d, username: e.target.value }))}
                placeholder="Логин" style={{
                  background: '#21252e', color: '#f1f5f9',
                  border: `1px solid ${usernameError ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 150, textAlign: 'right',
                }}
              />
              {usernameError && <span style={{ fontSize: 11, color: '#f87171' }}>{usernameError}</span>}
            </div>
          ) : (
            <span style={{ color: '#f1f5f9', fontSize: 14 }}>@{profile.username}</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Отображаемое имя</span>
          {isEditing ? (
            <input type="text" value={draft.displayName} onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
              placeholder="Как вас называть" style={{
                background: '#21252e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 150, textAlign: 'right',
              }}
            />
          ) : (
            <span style={{ color: profile.displayName !== profile.username ? '#f1f5f9' : '#334155', fontSize: 14 }}>
              {profile.displayName !== profile.username ? profile.displayName : '— не задано'}
            </span>
          )}
        </div>

        {numericFields.map(({ field, label, step, min, max }) => (
          <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>{label}</span>
            {isEditing ? (
              <div style={{ width: 170 }}>
                <NumberInput value={draft[field]} onChange={v => setDraft(d => ({ ...d, [field]: v }))} step={step} min={min} max={max} />
              </div>
            ) : (
              <span style={{ color: profile[field] ? '#f1f5f9' : '#334155', fontSize: 14 }}>{profile[field] || '— не указано'}</span>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Цель</span>
          {isEditing ? (
            <select value={draft.goal} onChange={e => setDraft(d => ({ ...d, goal: e.target.value as Goal }))}
              style={{
                background: '#21252e', color: draft.goal ? '#f1f5f9' : '#475569',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 180, cursor: 'pointer',
              }}
            >
              <option value="">— не указано</option>
              {GOAL_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          ) : (
            <span style={{ color: profile.goal ? '#f1f5f9' : '#334155', fontSize: 14 }}>
              {profile.goal ? GOAL_LABELS[profile.goal] : '— не указано'}
            </span>
          )}
        </div>
      </div>

      <div style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
        <div style={{ color: '#334155', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Данные
        </div>

        <button onClick={handleExport} disabled={exporting} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: 'rgba(110,231,183,0.1)', color: '#6ee7b7', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s', opacity: exporting ? 0.6 : 1, marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {exporting ? 'Экспорт...' : 'Экспорт тренировок (.txt)'}
        </button>

        <button onClick={() => setShowClearConfirm(true)} disabled={clearing} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: 'rgba(248,113,113,0.08)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s', opacity: clearing ? 0.6 : 1,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {clearing ? 'Очищаем...' : 'Очистить историю'}
        </button>
      </div>

      <button onClick={handleLogout} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)',
        color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
      }}>
        Выйти из аккаунта
      </button>

      <div style={{ textAlign: 'center', marginTop: 32, color: '#1e293b', fontSize: 12 }}>GymLog MVP v0.1</div>

      {showClearConfirm && (
        <ConfirmModal
          message="Вы уверены? Все тренировки будут удалены без возможности восстановления."
          onConfirm={handleClearHistory}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};