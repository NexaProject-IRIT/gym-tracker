// src/components/Workouts/WorkoutList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutsApi } from '../../hooks/useWorkoutsApi';
import type { Workout, WorkoutType } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../types/workout';
import { WorkoutForm } from './WorkoutForm';

const CSS = `
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconRepeat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M17 1l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 23l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('ru-RU', { day: '2-digit' }),
    month: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
    year: d.getFullYear().toString(),
  };
}

const WorkoutMenu: React.FC<{
  onEdit: () => void;
  onRepeat: () => void;
  onDelete: () => void;
}> = ({ onEdit, onRepeat, onDelete }) => {
  const items = [
    { icon: <IconEdit />, label: 'Открыть', action: onEdit, color: 'var(--muted)' },
    { icon: <IconRepeat />, label: 'Повторить', action: onRepeat, color: 'var(--muted)' },
    { icon: <IconTrash />, label: 'Удалить', action: onDelete, color: '#f87171' },
  ];

  return (
    <div style={{
      position: 'absolute', right: 0, top: 40, width: 180, zIndex: 10,
      background: 'var(--surface2)', borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--border2)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', background: 'var(--surface2)', border: 'none', cursor: 'pointer',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            color: item.color, fontSize: 13, fontWeight: 500,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};

const typeIconPath: Record<WorkoutType, string> = {
  strength: 'M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2',
  cardio: 'M3 12h4l3-8 4 16 3-8h4',
  flexibility: 'M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z',
  functional: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  custom: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
};

const WorkoutTypeIcon: React.FC<{ type: WorkoutType; color: string; size?: number }> = ({ type, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d={typeIconPath[type]} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WorkoutList: React.FC = () => {
  const navigate = useNavigate();
  const {
    workouts, loading, error, fetchWorkouts,
    addWorkout, deleteWorkout, repeatWorkout,
  } = useWorkoutsApi();
  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const [showForm, setShowForm] = useState(false);
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
        {/* Header */}
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

        {/* Stats */}
        {workouts.length > 0 && (
          <div style={{
            display: 'flex', gap: 12, padding: '0 32px 20px',
            maxWidth: 900, width: '100%', flexWrap: 'wrap', margin: '0 auto',
          }}>
            {(['strength', 'cardio', 'flexibility', 'functional'] as WorkoutType[]).map(type => {
              const count = workouts.filter(w => w.type === type).length;
              if (!count) return null;
              const c = WORKOUT_TYPE_COLORS[type];
              return (
                <div key={type} style={{
                  padding: '10px 16px', borderRadius: 12, border: `1px solid ${c.border}`,
                  background: c.bg, minWidth: 80,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 11, marginTop: 3, color: c.accent, fontWeight: 500 }}>
                    {WORKOUT_TYPE_LABELS[type].split('/')[0].trim()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--faint)' }}>Загрузка...</div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign: 'center', padding: 20, color: '#f87171', fontSize: 13 }}>{error}</div>
        )}

        {/* Overlay to close menu and block card clicks */}
        {openMenuId !== null && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpenMenuId(null)}
          />
        )}

        {/* List */}
        <div style={{
          flex: 1, padding: '0 32px', paddingBottom: 100,
          maxWidth: 900, width: '100%', margin: '0 auto',
        }}>
          {!loading && workouts.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }}>
                <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ color: 'var(--dim)', fontWeight: 500, margin: '0 0 4px' }}>Ещё нет тренировок</p>
              <p style={{ color: 'var(--ghost)', fontSize: 13, margin: 0 }}>Нажмите «Новая тренировка», чтобы начать</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 12,
            }}>
              {[...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(workout => {
                const c = WORKOUT_TYPE_COLORS[workout.type];
                const d = formatDate(workout.date);
                const isOpen = openMenuId === workout.id;
                const exCount = (workout as any).exercise_count ?? workout.exercises?.length ?? 0;

                return (
                  <div
                    key={workout.id}
                    onClick={() => handleSelectWorkout(workout.id)}
                    style={{
                      display: 'flex', alignItems: 'stretch', borderRadius: 16,
                      border: `1px solid ${c.border}`,
                      background: `linear-gradient(135deg, ${c.bg} 0%, var(--surface) 100%)`,
                      cursor: 'pointer', overflow: 'visible', position: 'relative',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: 4, borderRadius: '16px 0 0 16px', background: c.accent, flexShrink: 0 }} />
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '16px 14px', minWidth: 52, flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{d.day}</span>
                      <span style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2, textTransform: 'capitalize' }}>{d.month}</span>
                      <span style={{ fontSize: 10, color: 'var(--ghost)', marginTop: 1 }}>{d.year}</span>
                    </div>
                    <div style={{ width: 1, margin: '12px 0', background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: '14px 12px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <WorkoutTypeIcon type={workout.type} color={c.accent} size={13} />
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: c.accent,
                          background: c.bg, border: `1px solid ${c.border}`,
                          borderRadius: 20, padding: '1px 8px',
                        }}>
                          {WORKOUT_TYPE_LABELS[workout.type]}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {workout.name}
                      </p>
                      {exCount > 0 && (
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ghost)' }}>
                          {exCount} упражн.
                        </p>
                      )}
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', padding: '0 12px', position: 'relative', flexShrink: 0, zIndex: isOpen ? 51 : 'auto' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setOpenMenuId(isOpen ? null : workout.id)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: isOpen ? 'var(--border2)' : 'transparent',
                          color: 'var(--dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = isOpen ? 'var(--border2)' : 'transparent')}
                      >
                        <IconDots />
                      </button>
                      {isOpen && (
                        <WorkoutMenu
                          onEdit={() => handleSelectWorkout(workout.id)}
                          onRepeat={() => { repeatWorkout(workout.id); setOpenMenuId(null); }}
                          onDelete={() => { deleteWorkout(workout.id); setOpenMenuId(null); }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New workout button */}
        <div style={{
          position: 'fixed',
          bottom: isMobile ? 64 : 0,
          left: isMobile ? 0 : 220,
          right: 0,
          padding: '12px 32px 0',
          background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
          zIndex: 30,
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '14px 24px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #34d399)',
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

        {showForm && (
          <WorkoutForm
            onSave={data => {
              addWorkout({
                name: data.name, type: data.type, date: data.date,
                notes: data.notes,
                color: WORKOUT_TYPE_COLORS[data.type].accent,
                exercises: data.exercises.map(e => ({ ...e, id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` })),
              });
              setShowForm(false);
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </>
  );
};
