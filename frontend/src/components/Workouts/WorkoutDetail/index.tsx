import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Workout, WorkoutExercise, Exercise } from '../../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../../types/workout';
import { ExerciseModal } from '../../KnowledgeBase/ExerciseModal';
import { apiFetch } from '../../../lib/api';
import { ExerciseEditModal } from './ExerciseEditModal';
import { AddExerciseModal } from './AddExerciseModal';

interface Props {
  workout: Workout;
  onClose: () => void;
  onUpdate: (updates: Partial<Workout>) => void;
  onDelete: () => void;
  onRepeat: () => void;
  onUpdateExercise: (exId: string, updates: Partial<WorkoutExercise>) => void;
  onDeleteExercise: (exId: string) => void;
  onAddExercise: (exercise: Omit<WorkoutExercise, 'id'>) => void;
  onToggleDone: (exId: string) => void;
}

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEdit2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconRepeat2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTrash2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconPlus2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconDrag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
    <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
  </svg>
);
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTrophy = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12v4a6 6 0 0 1-12 0V4z"/>
    <path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3"/>
    <path d="M12 14v4M8 21h8M10 18h4"/>
  </svg>
);

function buildParamChips(ex: WorkoutExercise): string[] {
  const chips: string[] = [];
  if (ex.parameters.includes('sets') && ex.sets != null && ex.sets > 0) chips.push(`${ex.sets} подх`);
  if (ex.parameters.includes('reps') && ex.reps != null && ex.reps > 0) chips.push(`${ex.reps} повт`);
  if (ex.parameters.includes('weight') && ex.weight != null && ex.weight > 0) chips.push(`${ex.weight} кг`);
  if (ex.parameters.includes('time') && ex.time != null && ex.time > 0) {
    const m = Math.floor(ex.time / 60), s = ex.time % 60;
    chips.push(m > 0 ? `${m} мин` : `${s} сек`);
  }
  if (ex.parameters.includes('distance') && ex.distance != null && ex.distance > 0) chips.push(`${ex.distance} км`);
  return chips;
}

export const WorkoutDetail: React.FC<Props> = ({
  workout, onClose, onUpdate, onDelete, onRepeat, onUpdateExercise, onDeleteExercise, onAddExercise, onToggleDone,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workout.name);
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(workout.date.slice(0, 10));
  const [noteValue, setNoteValue] = useState(workout.notes ?? '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const currentModal = (location.state as { modal?: string } | null)?.modal;
  const isEditExerciseOpen = currentModal === 'edit-exercise';
  const showAddExercise = currentModal === 'add-exercise';
  const isInfoExerciseOpen = currentModal === 'info-exercise';

  const openEditExercise = (ex: WorkoutExercise) => {
    setEditingExercise(ex);
    navigate('.', { state: { modal: 'edit-exercise' } });
  };
  const closeEditExercise = () => navigate(-1);

  const openAddExercise = () => navigate('.', { state: { modal: 'add-exercise' } });
  const closeAddExercise = () => navigate(-1);

  const openExerciseInfo = async (ex: WorkoutExercise) => {
    if (!ex.exerciseId) return;
    navigate('.', { state: { modal: 'info-exercise' } });
    setInfoLoading(true);
    try {
      const data = await apiFetch<Exercise | Exercise[]>(`/exercises/?exercise_id=${ex.exerciseId}`);
      const detail = Array.isArray(data) ? data[0] : data;
      if (detail) setInfoExercise(detail);
      else navigate(-1);
    } catch { navigate(-1); }
    setInfoLoading(false);
  };

  const doneCount = workout.exercises.filter(e => e.isDone).length;

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== idx) setDragOverIndex(idx);
  };
  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null); setDragOverIndex(null); return;
    }
    const reordered = [...workout.exercises];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onUpdate({ exercises: reordered });
    setDragIndex(null); setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const c = WORKOUT_TYPE_COLORS[workout.type];
  const formatDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }); };

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Шапка */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', position: 'sticky', top: 0,
        background: 'var(--bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', zIndex: 95,
      }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: 'var(--dim)', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '6px 0',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--muted)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
        >
          <IconBack /> Назад
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {isEditMode ? (
            <button onClick={() => setIsEditMode(false)} style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 700,
            }}>
              Готово
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: showMenu ? 'var(--border2)' : 'var(--border)',
                  color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ···
              </button>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: 44, width: 200, zIndex: 100,
                    background: 'var(--surface)', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid var(--border2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { icon: <IconEdit2 />, label: 'Редактировать', action: () => { setIsEditMode(true); setShowMenu(false); }, color: 'var(--muted)' },
                      { icon: <IconRepeat2 />, label: 'Повторить', action: () => { onRepeat(); setShowMenu(false); }, color: 'var(--muted)' },
                      { icon: <IconTrash2 />, label: 'Удалить', action: () => { onDelete(); onClose(); }, color: '#f87171' },
                    ].map((item, i, arr) => (
                      <button key={i} onClick={item.action} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        color: item.color, fontSize: 13, fontWeight: 500,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Контент */}
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '28px 24px 120px' }}>
        {/* Тип */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: c.bg, border: `1px solid ${c.border}`, color: c.accent,
          }}>
            {WORKOUT_TYPE_LABELS[workout.type]}
          </span>
        </div>

        {/* Название */}
        {editingName && isEditMode ? (
          <input autoFocus value={nameValue} onChange={e => setNameValue(e.target.value)}
            onBlur={() => { onUpdate({ name: nameValue }); setEditingName(false); }}
            onKeyDown={e => e.key === 'Enter' && (onUpdate({ name: nameValue }), setEditingName(false))}
            style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--border2)', outline: 'none', width: '100%', marginBottom: 6 }} />
        ) : (
          <h1
            onClick={() => isEditMode && setEditingName(true)}
            style={{
              fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px',
              cursor: isEditMode ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {workout.name}
            {isEditMode && <span style={{ color: 'var(--ghost)' }}><IconPencil /></span>}
          </h1>
        )}

        {/* Дата */}
        {editingDate && isEditMode ? (
          <input type="date" autoFocus value={dateValue} onChange={e => setDateValue(e.target.value)}
            onBlur={() => { onUpdate({ date: dateValue }); setEditingDate(false); }}
            style={{ fontSize: 14, color: 'var(--dim)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', outline: 'none', marginBottom: 28 }} />
        ) : (
          <p
            onClick={() => isEditMode && setEditingDate(true)}
            style={{ color: 'var(--faint)', fontSize: 14, margin: '0 0 28px', cursor: isEditMode ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {formatDate(workout.date)}
            {isEditMode && <span style={{ color: 'var(--ghost)' }}><IconPencil /></span>}
          </p>
        )}

        {/* Заметка */}
        <div style={{ marginBottom: 24 }}>
          {isEditingNote ? (
            <textarea
              autoFocus
              value={noteValue}
              onChange={e => setNoteValue(e.target.value)}
              onBlur={() => { onUpdate({ notes: noteValue }); setIsEditingNote(false); }}
              placeholder="Как прошла тренировка? Самочувствие, замечания..."
              rows={3}
              style={{
                width: '100%', background: 'var(--border)',
                color: 'var(--text)', borderRadius: 12, padding: '12px 14px',
                border: '1px solid var(--accent-a30)', fontSize: 14,
                outline: 'none', resize: 'none', lineHeight: 1.6,
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          ) : noteValue ? (
            <div
              onClick={() => setIsEditingNote(true)}
              style={{
                cursor: 'pointer', padding: '12px 14px', borderRadius: 12,
                background: 'var(--border)',
                border: '1px solid var(--border2)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-a20)';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--border2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--border)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--accent)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Заметка</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{noteValue}</p>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNote(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: '1px dashed var(--border2)',
                borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                color: 'var(--ghost)', fontSize: 13, width: '100%', textAlign: 'left',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-a25)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--ghost)';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Добавить заметку к тренировке...
            </button>
          )}
        </div>

        {/* Разделитель */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

        {/* Прогресс выполнения */}
        {!isEditMode && workout.exercises.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--faint)' }}>Выполнено</span>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                {doneCount} / {workout.exercises.length}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(doneCount / workout.exercises.length) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Упражнения */}
        {workout.exercises.length === 0 && !isEditMode && (
          <p style={{ color: 'var(--faint)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>Упражнения не добавлены</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workout.exercises.map((ex, idx) => {
            const isDone = ex.isDone;
            const isDragging = dragIndex === idx;
            const isDragOver = dragOverIndex === idx && dragIndex !== idx;
            return (
              <div
                key={ex.id}
                draggable={isEditMode}
                onDragStart={isEditMode ? e => handleDragStart(e, idx) : undefined}
                onDragOver={isEditMode ? e => handleDragOver(e, idx) : undefined}
                onDrop={isEditMode ? e => handleDrop(e, idx) : undefined}
                onDragEnd={isEditMode ? handleDragEnd : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  background: isDragging
                    ? 'rgba(110,231,183,0.08)'
                    : isDone
                      ? 'rgba(110,231,183,0.04)'
                      : isEditMode ? 'var(--border)' : 'var(--border)',
                  border: `1px solid ${isDragOver
                    ? 'rgba(110,231,183,0.5)'
                    : isDone
                      ? 'rgba(110,231,183,0.15)'
                      : isEditMode ? 'var(--border2)' : 'var(--border)'}`,
                  borderLeft: isDone && !isEditMode ? '2px solid rgba(110,231,183,0.35)' : undefined,
                  borderTop: isDragOver ? '2px solid rgba(110,231,183,0.5)' : undefined,
                  opacity: isDragging ? 0.4 : 1,
                  cursor: isEditMode ? 'default' : 'default',
                  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
                }}
                onClick={() => isEditMode && openEditExercise(ex)}
              >
                {isEditMode && (
                  <div
                    onMouseDown={e => e.stopPropagation()}
                    style={{
                      cursor: 'grab', color: 'var(--ghost)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', padding: '2px 0',
                      userSelect: 'none',
                    }}
                    title="Перетащить"
                  >
                    <IconDrag />
                  </div>
                )}

                {!isEditMode && (
                  <button
                    onClick={e => { e.stopPropagation(); onToggleDone(ex.id); }}
                    style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      border: `1.5px solid ${isDone ? 'var(--accent)' : 'var(--border2)'}`,
                      background: isDone ? 'var(--accent-a10)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                      padding: 0,
                    }}
                  >
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )}

                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--faint)', minWidth: 20, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{idx + 1}</span>

                <div style={{ flex: 1, minWidth: 0, opacity: isDone ? 0.55 : 1, transition: 'opacity 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      color: 'var(--text)',
                      fontSize: 15, fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ex.name}
                    </span>
                    {ex.isPR && !ex.isDone && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                        color: '#fbbf24',
                        background: 'rgba(251,191,36,0.12)',
                        border: '1px solid rgba(251,191,36,0.28)',
                        borderRadius: 5, padding: '1px 6px',
                        letterSpacing: '0.03em',
                      }}>
                        <IconTrophy />
                        рекорд
                      </span>
                    )}
                    {ex.isCustom && (
                      <span style={{
                        fontSize: 11, color: 'var(--accent)', fontWeight: 500, flexShrink: 0,
                        background: 'var(--accent-a10)', borderRadius: 4, padding: '2px 6px',
                      }}>кастом</span>
                    )}
                  </div>
                  {buildParamChips(ex).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {buildParamChips(ex).map(chip => (
                        <span key={chip} style={{
                          background: 'var(--border2)', borderRadius: 6,
                          padding: '3px 8px', fontSize: 12, fontWeight: 500, color: 'var(--text3)',
                        }}>{chip}</span>
                      ))}
                    </div>
                  )}
                </div>

                {!ex.isCustom && !isEditMode && (
                  <button
                    onClick={e => { e.stopPropagation(); openExerciseInfo(ex); }}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border2)',
                      background: 'none', color: 'var(--faint)', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="База знаний"
                  >
                    <IconInfo />
                  </button>
                )}
                {isEditMode && (
                  <span style={{ color: 'var(--ghost)', flexShrink: 0 }}><IconEdit2 /></span>
                )}
              </div>
            );
          })}
        </div>

        {isEditMode && (
          <button
            onClick={openAddExercise}
            style={{
              width: '100%', marginTop: 10, padding: '13px', borderRadius: 14,
              border: '1px dashed var(--border2)', background: 'none', color: 'var(--faint)',
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,231,183,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--faint)'; }}
          >
            <IconPlus2 /> Добавить упражнение
          </button>
        )}
      </div>

      <div style={{ height: 160, flexShrink: 0 }} />

      {isEditExerciseOpen && editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onSave={u => onUpdateExercise(editingExercise.id, u)}
          onDelete={() => { onDeleteExercise(editingExercise.id); closeEditExercise(); }}
          onClose={closeEditExercise}
        />
      )}
      {showAddExercise && (
        <AddExerciseModal
          workoutType={workout.type}
          onAdd={onAddExercise}
          onClose={closeAddExercise}
        />
      )}

      {infoLoading && (() => {
        const skBase: React.CSSProperties = {
          background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
          backgroundSize: '200% 100%',
          animation: 'sk-shimmer 1.4s ease-in-out infinite',
          borderRadius: 6,
        };
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <style>{`@keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            <div style={{ width: '100%', height: '100dvh', background: 'var(--bg)', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...skBase, width: '100%', height: 260, borderRadius: 0, flexShrink: 0 }} />
              <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <div style={{ ...skBase, width: 80, height: 26, borderRadius: 20 }} />
                  <div style={{ ...skBase, width: 100, height: 26, borderRadius: 20 }} />
                </div>
                <div style={{ ...skBase, width: '68%', height: 26 }} />
                <div style={{ ...skBase, width: '88%', height: 14 }} />
                <div style={{ ...skBase, width: '72%', height: 14 }} />
                <div style={{ ...skBase, width: '80%', height: 14 }} />
                <div style={{ ...skBase, width: '58%', height: 14 }} />
              </div>
            </div>
          </div>
        );
      })()}

      <ExerciseModal exercise={isInfoExerciseOpen ? infoExercise : null} onClose={() => navigate(-1)} zIndex={300} />
    </div>
  );
};
