import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutsContext } from '../../contexts/WorkoutsContext';
import { WORKOUT_TYPE_COLORS } from '../../types/workout';
import { WorkoutForm } from './WorkoutForm';
import { WorkoutCard, WorkoutCardSkeleton } from './WorkoutCard';
import { StatsRow } from './StatsRow';
import { WorkoutEmptyState } from './WorkoutEmptyState';

const CSS = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  @keyframes sk-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

export const WorkoutList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    workouts, loading, error, fetchWorkouts,
    addWorkout, deleteWorkout, repeatWorkout,
  } = useWorkoutsContext();
  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const showForm = (location.state as { modal?: string } | null)?.modal === 'form';
  const openForm = () => navigate('.', { state: { modal: 'form' } });
  const closeForm = () => navigate(-1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleSelectWorkout = (workoutId: string) => {
    setOpenMenuId(null);
    navigate(`/workouts/${workoutId}`);
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '40px 32px 16px', maxWidth: 900, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              Тренировки
            </h1>
            <span style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 2 }}>
              {workouts.length} {workouts.length === 1 ? 'запись' : workouts.length < 5 ? 'записи' : 'записей'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>История и дневник тренировок</p>
        </div>

        {workouts.length > 0 && <StatsRow workouts={workouts} />}

        {error && (
          <div style={{ textAlign: 'center', padding: 20, color: '#f87171', fontSize: 13 }}>{error}</div>
        )}

        {openMenuId !== null && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpenMenuId(null)} />
        )}

        <div style={{
          flex: 1, padding: '0 32px', paddingBottom: 100,
          maxWidth: 900, width: '100%', margin: '0 auto',
        }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => <WorkoutCardSkeleton key={i} />)}
            </div>
          ) : workouts.length === 0 ? (
            <WorkoutEmptyState onAdd={openForm} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {[...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  isMenuOpen={openMenuId === workout.id}
                  onSelect={() => handleSelectWorkout(workout.id)}
                  onMenuToggle={() => setOpenMenuId(openMenuId === workout.id ? null : workout.id)}
                  onEdit={() => {
                    setOpenMenuId(null);
                    navigate(`/workouts/${workout.id}`, { state: { edit: true } });
                  }}
                  onRepeat={() => { repeatWorkout(workout.id); setOpenMenuId(null); }}
                  onDelete={() => { deleteWorkout(workout.id); setOpenMenuId(null); }}
                />
              ))}
            </div>
          )}
        </div>

        {workouts.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: isMobile ? 64 : 0,
            left: isMobile ? 0 : 220,
            right: 0,
            padding: isMobile ? '12px 32px 0' : '12px 32px 20px',
            background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
            zIndex: 30,
          }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <button
                onClick={openForm}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '14px 24px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: 'var(--accent-fg)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(110,231,183,0.25)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(110,231,183,0.35)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(110,231,183,0.25)';
                }}
              >
                <IconPlus />
                Новая тренировка
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <WorkoutForm
            onSave={data => {
              addWorkout({
                name: data.name, type: data.type, date: data.date,
                notes: data.notes,
                color: WORKOUT_TYPE_COLORS[data.type].accent,
                exercises: data.exercises.map(e => ({ ...e, id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` })),
              });
              closeForm();
            }}
            onClose={closeForm}
          />
        )}
      </div>
    </>
  );
};
