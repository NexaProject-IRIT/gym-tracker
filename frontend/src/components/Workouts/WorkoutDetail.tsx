// src/components/Workouts/WorkoutDetail.tsx
import React, { useState } from 'react';
import type { Workout, WorkoutExercise, WorkoutType, ParameterType, Exercise } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS, DEFAULT_PARAMS_FOR_TYPE, PARAMETER_LABELS } from '../../types/workout';
import { ExerciseModal } from '../KnowledgeBase/ExerciseModal';

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

const ExerciseEditModal: React.FC<{
  exercise: WorkoutExercise;
  onSave: (u: Partial<WorkoutExercise>) => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ exercise, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.sets?.toString() ?? '');
  const [reps, setReps] = useState(exercise.reps?.toString() ?? '');
  const [weight, setWeight] = useState(exercise.weight?.toString() ?? '');
  const [time, setTime] = useState(exercise.time?.toString() ?? '');
  const [distance, setDistance] = useState(exercise.distance?.toString() ?? '');
  const [params, setParams] = useState<ParameterType[]>(exercise.parameters);
  const allParams: ParameterType[] = ['sets', 'reps', 'weight', 'time', 'distance'];

  const toggle = (p: ParameterType) => setParams(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSave = () => {
    onSave({
      name, parameters: params,
      sets: params.includes('sets') && sets ? parseInt(sets) : undefined,
      reps: params.includes('reps') && reps ? parseInt(reps) : undefined,
      weight: params.includes('weight') && weight ? parseFloat(weight) : undefined,
      time: params.includes('time') && time ? parseInt(time) : undefined,
      distance: params.includes('distance') && distance ? parseFloat(distance) : undefined,
    });
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 20, padding: '24px', border: '1px solid var(--border2)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>Редактировать упражнение</h3>

        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Параметры</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {allParams.map(p => (
            <button key={p} onClick={() => toggle(p)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: params.includes(p) ? 'var(--accent-a10)' : 'var(--border)',
              color: params.includes(p) ? 'var(--accent)' : 'var(--dim)',
              outline: params.includes(p) ? '1px solid var(--accent-a30)' : '1px solid var(--border2)',
            }}>
              {PARAMETER_LABELS[p].label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 20, alignItems: 'end' }}>
          {params.includes('sets') && <Field label="Подходы" value={sets} onChange={setSets} />}
          {params.includes('reps') && <Field label="Повторы" value={reps} onChange={setReps} />}
          {params.includes('weight') && <Field label="Вес (кг)" value={weight} onChange={setWeight} step="0.5" />}
          {params.includes('time') && <TimeFieldD value={time} onChange={setTime} />}
          {params.includes('distance') && <Field label="Дистанция (км)" value={distance} onChange={setDistance} step="0.1" />}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDelete} style={btnStyle('danger')}>
            <IconTrash2 /> Удалить
          </button>
          <button onClick={handleSave} style={btnStyle('primary')}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const AddExerciseModal: React.FC<{
  workoutType: WorkoutType;
  onAdd: (ex: Omit<WorkoutExercise, 'id'>) => void;
  onClose: () => void;
}> = ({ workoutType, onAdd, onClose }) => {
  const [name, setName] = useState('');
  const [params, setParams] = useState<ParameterType[]>(DEFAULT_PARAMS_FOR_TYPE[workoutType]);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [time, setTime] = useState('');
  const [distance, setDistance] = useState('');
  const allParams: ParameterType[] = ['sets', 'reps', 'weight', 'time', 'distance'];
  const toggle = (p: ParameterType) => setParams(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleAdd = () => {
    if (!name.trim() || !params.length) return;
    onAdd({
      name: name.trim(), isCustom: true, parameters: params,
      sets: params.includes('sets') && sets ? parseInt(sets) : undefined,
      reps: params.includes('reps') && reps ? parseInt(reps) : undefined,
      weight: params.includes('weight') && weight ? parseFloat(weight) : undefined,
      time: params.includes('time') && time ? parseInt(time) : undefined,
      distance: params.includes('distance') && distance ? parseFloat(distance) : undefined,
    });
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 20, padding: '24px', border: '1px solid var(--border2)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>Добавить упражнение</h3>

        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Введите название..."
          style={{ width: '100%', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 12, padding: '10px 14px', border: '1px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Параметры</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {allParams.map(p => (
            <button key={p} onClick={() => toggle(p)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: params.includes(p) ? 'var(--accent-a10)' : 'var(--border)',
              color: params.includes(p) ? 'var(--accent)' : 'var(--dim)',
              outline: params.includes(p) ? '1px solid var(--accent-a30)' : '1px solid var(--border2)',
            }}>
              {PARAMETER_LABELS[p].label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 20, alignItems: 'end' }}>
          {params.includes('sets') && <Field label="Подходы" value={sets} onChange={setSets} />}
          {params.includes('reps') && <Field label="Повторы" value={reps} onChange={setReps} />}
          {params.includes('weight') && <Field label="Вес (кг)" value={weight} onChange={setWeight} step="0.5" />}
          {params.includes('time') && <TimeFieldD value={time} onChange={setTime} />}
          {params.includes('distance') && <Field label="Дистанция (км)" value={distance} onChange={setDistance} step="0.1" />}
        </div>

        <button onClick={handleAdd} disabled={!name.trim() || !params.length} style={btnStyle('primary')}>
          Добавить упражнение
        </button>
      </div>
    </div>
  );
};

function btnStyle(variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'opacity 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'linear-gradient(135deg, #6ee7b7, #34d399)', color: '#064e3b' };
  if (variant === 'danger') return { ...base, background: 'rgba(248,113,113,0.1)', color: '#f87171', outline: '1px solid rgba(248,113,113,0.2)' };
  return { ...base, background: 'var(--border)', color: 'var(--muted)', outline: '1px solid var(--border2)' };
}

const TimeFieldD: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [unit, setUnit] = React.useState<'sec' | 'min'>('sec');
  const num = parseInt(value || '0');
  const displayVal = unit === 'min' ? Math.round(num / 60) : num;
  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    const nd = Math.max(0, displayVal - 1);
    onChange(String(unit === 'min' ? nd * 60 : nd));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    const nd = displayVal + 1;
    onChange(String(unit === 'min' ? nd * 60 : nd));
  };
  const handleChange = (raw: string) => {
    const n = parseInt(raw) || 0;
    onChange(unit === 'min' ? String(n * 60) : String(n));
  };
  const switchUnit = (e: React.MouseEvent, u: 'sec' | 'min') => {
    e.preventDefault();
    setUnit(u);
  };
  const btnS: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
    background: 'var(--border2)', color: 'var(--muted)', fontSize: 18, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.1s',
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 11, color: 'var(--dim)' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{
              padding: '2px 8px', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 500,
              background: unit === u ? 'var(--accent-a20)' : 'transparent',
              color: unit === u ? 'var(--accent)' : 'var(--faint)',
            }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 14,
            outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >+</button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; step?: string }> = ({ label, value, onChange, step }) => {
  const stepNum = parseFloat(step ?? '1') || 1;
  const isInt = !step || step === '1';
  const fmt = (n: number) => isInt ? String(Math.round(n)) : String(parseFloat(n.toFixed(1)));
  const dec = (e: React.MouseEvent) => { e.preventDefault(); onChange(fmt(Math.max(0, parseFloat(value || '0') - stepNum))); };
  const inc = (e: React.MouseEvent) => { e.preventDefault(); onChange(fmt(parseFloat(value || '0') + stepNum)); };
  const btnS: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
    background: 'var(--border2)', color: 'var(--muted)', fontSize: 18, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.1s',
  };
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--dim)', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 14,
            outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >+</button>
      </div>
    </div>
  );
};

export const WorkoutDetail: React.FC<Props> = ({
  workout, onClose, onUpdate, onDelete, onRepeat, onUpdateExercise, onDeleteExercise, onAddExercise, onToggleDone,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workout.name);
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(workout.date.slice(0, 10));
  const [noteValue, setNoteValue] = useState(workout.notes ?? '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const openExerciseInfo = async (ex: WorkoutExercise) => {
    if (!ex.exerciseId) return;
    setInfoLoading(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(`/exercises/?exercise_id=${ex.exerciseId}`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const detail = Array.isArray(data) ? data[0] : data;
        if (detail) setInfoExercise(detail as Exercise);
      }
    } catch {}
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
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

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
              background: 'linear-gradient(135deg, #6ee7b7, #34d399)', color: '#064e3b', fontSize: 13, fontWeight: 700,
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
            onBlur={() => { onUpdate({ date: new Date(dateValue).toISOString() }); setEditingDate(false); }}
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
                background: 'linear-gradient(90deg, #6ee7b7, #34d399)',
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
                onClick={() => isEditMode && setEditingExercise(ex)}
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
            onClick={() => setShowAddExercise(true)}
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

      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onSave={u => onUpdateExercise(editingExercise.id, u)}
          onDelete={() => { onDeleteExercise(editingExercise.id); setEditingExercise(null); }}
          onClose={() => setEditingExercise(null)}
        />
      )}
      {showAddExercise && (
        <AddExerciseModal
          workoutType={workout.type}
          onAdd={onAddExercise}
          onClose={() => setShowAddExercise(false)}
        />
      )}

      {infoLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="var(--accent-a20)" strokeWidth="2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: 'var(--dim)', fontSize: 13, fontWeight: 500 }}>Загрузка...</span>
          </div>
        </div>
      )}

      <ExerciseModal exercise={infoExercise} onClose={() => setInfoExercise(null)} zIndex={300} />
    </div>
  );
};
