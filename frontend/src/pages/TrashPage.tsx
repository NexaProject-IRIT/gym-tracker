import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../lib/api';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { ConfirmModal } from '../components/Profile/ConfirmModal';

interface TrashedWorkout {
  id: string;
  name: string;
  type: string;
  date: string;
  color: string;
  exercise_count: number;
  deleted_at: string;
  days_left: number;
}

const TYPE_LABELS: Record<string, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Гибкость',
  functional: 'Функциональная',
  custom: 'Кастомная',
};

export const TrashPage: React.FC = () => {
  const [items, setItems] = useState<TrashedWorkout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashedWorkout | null>(null);

  const { fetchWorkouts } = useWorkoutsContext();

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<TrashedWorkout[]>('/workouts/trash/');
      setItems(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить корзину');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (w: TrashedWorkout) => {
    setBusy(w.id);
    try {
      await apiFetch(`/workouts/${w.id}/restore/`, { method: 'POST' });
      setItems(prev => (prev ?? []).filter(x => x.id !== w.id));
      fetchWorkouts();  // активный список тоже надо обновить
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось восстановить');
    } finally {
      setBusy(null);
    }
  };

  const handlePurge = async (w: TrashedWorkout) => {
    setPurgeTarget(null);
    setBusy(w.id);
    try {
      await apiFetch(`/workouts/${w.id}/purge/`, { method: 'DELETE' });
      setItems(prev => (prev ?? []).filter(x => x.id !== w.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось удалить');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '48px 24px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link to="/profile" style={{
          color: 'var(--muted)', textDecoration: 'none', fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Профиль
        </Link>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Корзина</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 24px' }}>
        Удалённые тренировки хранятся 30 дней, потом стираются навсегда.
      </p>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', color: '#f87171',
          padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {items === null ? (
        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)',
        }}>
          Корзина пуста.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(w => (
            <div key={w.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 16, display: 'flex',
              alignItems: 'center', gap: 14, opacity: busy === w.id ? 0.5 : 1,
            }}>
              <div style={{ width: 4, alignSelf: 'stretch', background: w.color, borderRadius: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.name}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>{TYPE_LABELS[w.type] ?? w.type}</span>
                  <span>·</span>
                  <span>{new Date(w.date).toLocaleDateString('ru-RU')}</span>
                  <span>·</span>
                  <span>{w.exercise_count} упр.</span>
                  <span>·</span>
                  <span style={{ color: w.days_left <= 3 ? '#f87171' : 'var(--muted)' }}>
                    осталось {w.days_left} дн.
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRestore(w)}
                disabled={busy === w.id}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: 'var(--accent-a10)', color: 'var(--accent)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >Восстановить</button>
              <button
                onClick={() => setPurgeTarget(w)}
                disabled={busy === w.id}
                title="Удалить навсегда"
                style={{
                  padding: '8px 10px', borderRadius: 10, border: 'none',
                  background: 'rgba(248,113,113,0.08)', color: '#f87171',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {purgeTarget && (
        <ConfirmModal
          message={`Удалить тренировку «${purgeTarget.name}» навсегда? Восстановить будет нельзя.`}
          confirmButtonLabel="Удалить навсегда"
          onConfirm={() => handlePurge(purgeTarget)}
          onCancel={() => setPurgeTarget(null)}
        />
      )}
    </div>
  );
};
