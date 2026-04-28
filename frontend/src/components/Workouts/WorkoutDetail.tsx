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
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function formatExerciseLine(ex: WorkoutExercise): string {
  const parts: string[] = [];
  if (ex.sets !== undefined && ex.sets !== null && ex.parameters.includes('sets')) parts.push(`${ex.sets} подх`);
  if (ex.reps !== undefined && ex.reps !== null && ex.parameters.includes('reps')) parts.push(`× ${ex.reps} повт`);
  if (ex.weight !== undefined && ex.weight !== null && ex.parameters.includes('weight')) parts.push(`× ${ex.weight} кг`);
  if (ex.time !== undefined && ex.time !== null && ex.parameters.includes('time')) {
    const m = Math.floor(ex.time / 60), s = ex.time % 60;
    parts.push(m > 0 ? `${m} мин` : `${s} сек`);
  }
  if (ex.distance !== undefined && ex.distance !== null && ex.parameters.includes('distance')) parts.push(`${ex.distance} км`);
  return parts.join(' ');
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
        style={{ width: '100%', maxWidth: 480, background: '#1a1d24', borderRadius: 20, padding: '24px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>Редактировать упражнение</h3>

        <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)}
          style={{ width: '100%', background: '#21252e', color: '#f1f5f9', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Параметры</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {allParams.map(p => (
            <button key={p} onClick={() => toggle(p)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: params.includes(p) ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.05)',
              color: params.includes(p) ? '#6ee7b7' : '#64748b',
              outline: params.includes(p) ? '1px solid rgba(110,231,183,0.3)' : '1px solid rgba(255,255,255,0.08)',
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
        style={{ width: '100%', maxWidth: 480, background: '#1a1d24', borderRadius: 20, padding: '24px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>Добавить упражнение</h3>

        <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Введите название..."
          style={{ width: '100%', background: '#21252e', color: '#f1f5f9', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Параметры</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {allParams.map(p => (
            <button key={p} onClick={() => toggle(p)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: params.includes(p) ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.05)',
              color: params.includes(p) ? '#6ee7b7' : '#64748b',
              outline: params.includes(p) ? '1px solid rgba(110,231,183,0.3)' : '1px solid rgba(255,255,255,0.08)',
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
  return { ...base, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', outline: '1px solid rgba(255,255,255,0.08)' };
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
    background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 18, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.1s',
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 11, color: '#64748b' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{
              padding: '2px 8px', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 500,
              background: unit === u ? 'rgba(110,231,183,0.2)' : 'transparent',
              color: unit === u ? '#6ee7b7' : '#475569',
            }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#21252e', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: '#f1f5f9', border: 'none', fontSize: 14,
            outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
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
    background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 18, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.1s',
  };
  return (
    <div>
      <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#21252e', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: '#f1f5f9', border: 'none', fontSize: 14,
            outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >+</button>
      </div>
    </div>
  );
};

export const WorkoutDetail: React.FC<Props> = ({
  workout, onClose, onUpdate, onDelete, onRepeat, onUpdateExercise, onDeleteExercise, onAddExercise,
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

  // ── Модалка деталей упражнения ──
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

  // ── Чекбоксы выполнения ──
  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set());
  const toggleDone = (id: string) => {
    setDoneExercises(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const c = WORKOUT_TYPE_COLORS[workout.type];
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: '#111318',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Шапка */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', position: 'sticky', top: 0,
        background: 'rgba(17,19,24,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10,
      }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '6px 0',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
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
                  background: showMenu ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: '#94a3b8', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ···
              </button>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowMenu(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: 44, width: 200, zIndex: 100,
                    background: '#1e2330', borderRadius: 14, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                    onClick={e => e.stopPropagation()}
                  >
                    {[
                      { icon: <IconEdit2 />, label: 'Редактировать', action: () => { setIsEditMode(true); setShowMenu(false); }, color: '#94a3b8' },
                      { icon: <IconRepeat2 />, label: 'Повторить', action: () => { onRepeat(); onClose(); }, color: '#94a3b8' },
                      { icon: <IconTrash2 />, label: 'Удалить', action: () => { onDelete(); onClose(); }, color: '#f87171' },
                    ].map((item, i, arr) => (
                      <button key={i} onClick={item.action} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        color: item.color, fontSize: 13, fontWeight: 500,
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
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
            style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)', outline: 'none', width: '100%', marginBottom: 6 }} />
        ) : (
          <h1
            onClick={() => isEditMode && setEditingName(true)}
            style={{
              fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px',
              cursor: isEditMode ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {workout.name}
            {isEditMode && <span style={{ color: '#334155' }}><IconPencil /></span>}
          </h1>
        )}

        {/* Дата */}
        {editingDate && isEditMode ? (
          <input type="date" autoFocus value={dateValue} onChange={e => setDateValue(e.target.value)}
            onBlur={() => { onUpdate({ date: new Date(dateValue).toISOString() }); setEditingDate(false); }}
            style={{ fontSize: 14, color: '#64748b', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)', outline: 'none', marginBottom: 28 }} />
        ) : (
          <p
            onClick={() => isEditMode && setEditingDate(true)}
            style={{ color: '#475569', fontSize: 14, margin: '0 0 28px', cursor: isEditMode ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {formatDate(workout.date)}
            {isEditMode && <span style={{ color: '#334155' }}><IconPencil /></span>}
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
                width: '100%', background: 'rgba(255,255,255,0.04)',
                color: '#f1f5f9', borderRadius: 12, padding: '12px 14px',
                border: '1px solid rgba(110,231,183,0.3)', fontSize: 14,
                outline: 'none', resize: 'none', lineHeight: 1.6,
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          ) : noteValue ? (
            <div
              onClick={() => setIsEditingNote(true)}
              style={{
                cursor: 'pointer', padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(110,231,183,0.2)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Заметка</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{noteValue}</p>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNote(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                color: '#334155', fontSize: 13, width: '100%', textAlign: 'left',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,231,183,0.25)';
                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color = '#334155';
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
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

        {/* Прогресс выполнения */}
        {!isEditMode && workout.exercises.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#475569' }}>Выполнено</span>
              <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>
                {doneExercises.size} / {workout.exercises.length}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(doneExercises.size / workout.exercises.length) * 100}%`,
                background: 'linear-gradient(90deg, #6ee7b7, #34d399)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Упражнения */}
        {workout.exercises.length === 0 && !isEditMode && (
          <p style={{ color: '#475569', textAlign: 'center', marginTop: 40, fontSize: 14 }}>Упражнения не добавлены</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {workout.exercises.map((ex, idx) => {
            const isDone = doneExercises.has(ex.id);
            return (
              <div
                key={ex.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  background: isDone
                    ? 'rgba(110,231,183,0.04)'
                    : isEditMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isDone
                    ? 'rgba(110,231,183,0.15)'
                    : isEditMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                  cursor: isEditMode ? 'pointer' : 'default',
                  transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
                  opacity: isDone ? 0.6 : 1,
                }}
                onClick={() => isEditMode && setEditingExercise(ex)}
                onMouseEnter={e => isEditMode && ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={e => isEditMode && ((e.currentTarget as HTMLDivElement).style.background = isDone ? 'rgba(110,231,183,0.04)' : 'rgba(255,255,255,0.04)')}
              >
                {/* Чекбокс — только в режиме просмотра */}
                {!isEditMode && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleDone(ex.id); }}
                    style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      border: `1.5px solid ${isDone ? '#6ee7b7' : 'rgba(255,255,255,0.15)'}`,
                      background: isDone ? 'rgba(110,231,183,0.15)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                      padding: 0,
                    }}
                  >
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )}

                <span style={{ fontSize: 11, color: '#334155', width: 20, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{idx + 1}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      color: isDone ? '#475569' : '#f1f5f9',
                      fontSize: 14, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'color 0.15s',
                    }}>
                      {ex.name}
                    </span>
                    {ex.isCustom && <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>кастом</span>}
                  </div>
                  <div style={{ color: isDone ? '#334155' : '#475569', fontSize: 12, marginTop: 2, transition: 'color 0.15s' }}>
                    {formatExerciseLine(ex)}
                  </div>
                </div>

                {!ex.isCustom && !isEditMode && (
                  <button
                    onClick={e => { e.stopPropagation(); openExerciseInfo(ex); }}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="База знаний"
                  >
                    <IconInfo />
                  </button>
                )}
                {isEditMode && (
                  <span style={{ color: '#334155', flexShrink: 0 }}><IconEdit2 /></span>
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
              border: '1px dashed rgba(255,255,255,0.1)', background: 'none', color: '#475569',
              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,231,183,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
          >
            <IconPlus2 /> Добавить упражнение
          </button>
        )}
      </div>

      {/* Кнопка внизу */}
      {!isEditMode && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 24px 28px',
          background: 'linear-gradient(to top, #111318 50%, transparent)',
          zIndex: 20,
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <button
              onClick={() => { onRepeat(); onClose(); }}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)`,
                color: '#0a0a0a', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 20px ${c.accent}33`,
              }}
            >
              <IconRepeat2 /> Повторить тренировку
            </button>
          </div>
        </div>
      )}

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

      {/* Спиннер загрузки деталей упражнения */}
      {infoLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(110,231,183,0.2)" strokeWidth="2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Загрузка...</span>
          </div>
        </div>
      )}

      {/* Полноценная модалка упражнения из базы знаний */}
      <ExerciseModal exercise={infoExercise} onClose={() => setInfoExercise(null)} zIndex={300} />
    </div>
  );
};