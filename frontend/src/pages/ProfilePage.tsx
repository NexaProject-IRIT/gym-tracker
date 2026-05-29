import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authedFetch, clearTokens } from '../utils/api';
import { apiFetch, ApiError } from '../lib/api';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { PersonalDataCard, type ProfileData, type Goal } from '../components/Profile/PersonalDataCard';
import { DataActionsCard } from '../components/Profile/DataActionsCard';
import { ThemeSettingsCard } from '../components/Profile/ThemeSettingsCard';
import { ConfirmModal } from '../components/Profile/ConfirmModal';
import { ProfileHeroCard } from '../components/Profile/ProfileHeroCard';

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
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { workouts, fetchWorkouts } = useWorkoutsContext();
  useEffect(() => { if (workouts.length === 0) fetchWorkouts(); }, [workouts.length, fetchWorkouts]);

  const weeklyStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const mondayThisWeek = new Date(now);
    mondayThisWeek.setHours(0, 0, 0, 0);
    mondayThisWeek.setDate(now.getDate() - (day - 1));
    let streak = 0;
    for (let w = 0; w < 200; w++) {
      const ws = new Date(mondayThisWeek);
      ws.setDate(mondayThisWeek.getDate() - w * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 7);
      const has = workouts.some(wk => {
        if (!wk.date) return false;
        const wd = new Date(wk.date);
        return wd >= ws && wd < we;
      });
      if (has) streak++;
      else if (w === 0) continue;
      else break;
    }
    return streak;
  }, [workouts]);

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
      } finally {
        setProfileLoaded(true);
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

  const skBase: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
    backgroundSize: '200% 100%',
    animation: 'sk-shimmer 1.4s ease-in-out infinite',
    borderRadius: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
      <style>{`@keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {profileLoaded ? (
        <div style={{ marginBottom: 32 }}>
          <ProfileHeroCard
            name={profile.displayName || profile.username || ''}
            username={profile.username || ''}
            streak={weeklyStreak}
            totalLabel={statsLoaded ? String(stats.total) : null}
            thisMonth={statsLoaded ? stats.this_month : null}
          />
        </div>
      ) : (
        <div style={{
          width: '100%', maxWidth: 560, margin: '0 auto 32px',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 26, padding: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            <div style={{ ...skBase, width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...skBase, width: '70%', height: 22, marginBottom: 8 }} />
              <div style={{ ...skBase, width: '40%', height: 14, marginBottom: 10 }} />
              <div style={{ ...skBase, width: 120, height: 18, borderRadius: 999 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ ...skBase, height: 68, borderRadius: 16 }} />
            <div style={{ ...skBase, height: 68, borderRadius: 16 }} />
          </div>
        </div>
      )}

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

      <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <img src="/favicon.png" alt="GymLog" style={{ width: 20, height: 20, borderRadius: 6, display: 'block' }} />
        <span style={{ color: 'var(--ghost)', fontSize: 12 }}>GymLog MVP v0.1</span>
      </div>

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
