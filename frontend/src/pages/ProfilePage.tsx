import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authedFetch, clearTokens } from '../utils/api';
import { apiFetch, ApiError } from '../lib/api';
import { PersonalDataCard, type ProfileData, type Goal, GOAL_LABELS } from '../components/Profile/PersonalDataCard';
import { DataActionsCard } from '../components/Profile/DataActionsCard';
import { ThemeSettingsCard } from '../components/Profile/ThemeSettingsCard';
import { ConfirmModal } from '../components/Profile/ConfirmModal';

interface Stats {
  total: number;
  this_month: number;
}

interface ProfileApiResponse {
  username?: string;
  display_name?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  goal?: string;
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
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="6" r="3" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 21v-1a7 7 0 0114 0v1" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function readProfileFromResponse(data: ProfileApiResponse): ProfileData {
  return {
    username: data.username ?? '',
    displayName: data.display_name ?? data.username ?? '',
    age: data.age != null ? String(data.age) : '',
    weight: data.weight != null ? String(data.weight) : '',
    height: data.height != null ? String(data.height) : '',
    goal: (data.goal as Goal) || '',
  };
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const showClearConfirm = (location.state as { modal?: string } | null)?.modal === 'confirm';
  const [profile, setProfile] = useState<ProfileData>({ username: '', displayName: '', age: '', weight: '', height: '', goal: '' });
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, this_month: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiFetch<ProfileApiResponse>('/auth/profile/');
        const p = readProfileFromResponse(data);
        setProfile(p);
        setDraft(p);
        localStorage.setItem('user', JSON.stringify(data));
      } catch {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}') as ProfileApiResponse;
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
        const data = await apiFetch<{ total?: number; this_month?: number }>('/workouts/stats/');
        setStats({ total: data.total ?? 0, this_month: data.this_month ?? 0 });
        setStatsLoaded(true);
      } catch { /* statsLoaded остаётся false */ }
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

      const data = await apiFetch<ProfileApiResponse>('/auth/profile/', { method: 'PATCH', body: JSON.stringify(body) });
      const p = readProfileFromResponse(data);
      setProfile(p);
      setDraft(p);
      localStorage.setItem('user', JSON.stringify(data));
      setIsEditing(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const err = e.data as Record<string, unknown> | undefined;
        const usernameErr = (err?.username as string[] | undefined)?.[0];
        if (usernameErr) { setUsernameError(usernameErr); return; }
        setSaveError(e.message);
      } else {
        setSaveError('Нет связи с сервером');
      }
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
    navigate(-1);
    setClearing(true);
    try {
      await apiFetch('/workouts/clear/', { method: 'DELETE' });
      setStats({ total: 0, this_month: 0 });
    } catch { /* ignore */ }
    setClearing(false);
  };

  const handleLogout = () => {
    apiFetch('/auth/logout/', { method: 'POST' }).catch(() => {});
    clearTokens();
    navigate('/login');
  };

  const statItems = [
    { label: 'Тренировок', value: statsLoaded ? formatWorkouts(stats.total) : '—' },
    { label: 'Этот месяц', value: statsLoaded ? String(stats.this_month) : '—' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--accent-a12)',
          border: '2px solid var(--accent-a30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <IconPerson />
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>{profile.displayName || profile.username || 'Ваш профиль'}</h2>
        <p style={{ margin: '0 0 2px', color: 'var(--faint)', fontSize: 13 }}>@{profile.username}</p>
        <p style={{ margin: 0, color: 'var(--faint)', fontSize: 14 }}>Личные данные и настройки</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
        {statItems.map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '20px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <PersonalDataCard
        profile={profile}
        draft={draft}
        isEditing={isEditing}
        saving={saving}
        saveError={saveError}
        usernameError={usernameError}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onDraftChange={setDraft}
      />

      <ThemeSettingsCard />

      <DataActionsCard
        exporting={exporting}
        clearing={clearing}
        onExport={handleExport}
        onClearRequest={() => navigate('.', { state: { modal: 'confirm' } })}
      />

      <button onClick={handleLogout} style={{
        width: '100%', padding: '14px', borderRadius: 12,
        border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)',
        color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
      }}>
        Выйти из аккаунта
      </button>

      <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--ghost)', fontSize: 12 }}>GymLog MVP v0.1</div>

      {showClearConfirm && (
        <ConfirmModal
          message="Вы уверены? Все тренировки будут удалены без возможности восстановления."
          onConfirm={handleClearHistory}
          onCancel={() => navigate(-1)}
        />
      )}
    </div>
  );
};
