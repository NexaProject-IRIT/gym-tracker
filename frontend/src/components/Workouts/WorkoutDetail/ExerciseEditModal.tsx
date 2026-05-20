import React, { useState } from 'react';
import type { WorkoutExercise, ParameterType } from '../../../types/workout';
import { PARAMETER_LABELS } from '../../../types/workout';
import { NumberField } from './NumberField';
import { TimeField } from './TimeField';

function btnStyle(variant: 'primary' | 'danger'): React.CSSProperties {
  const base: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'opacity 0.15s',
  };
  if (variant === 'primary') return { ...base, background: 'linear-gradient(135deg, #6ee7b7, #34d399)', color: '#064e3b' };
  return { ...base, background: 'rgba(248,113,113,0.1)', color: '#f87171', outline: '1px solid rgba(248,113,113,0.2)' };
}

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Props {
  exercise: WorkoutExercise;
  onSave: (u: Partial<WorkoutExercise>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ExerciseEditModal: React.FC<Props> = ({ exercise, onSave, onDelete, onClose }) => {
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
          {params.includes('sets') && <NumberField label="Подходы" value={sets} onChange={setSets} />}
          {params.includes('reps') && <NumberField label="Повторы" value={reps} onChange={setReps} />}
          {params.includes('weight') && <NumberField label="Вес (кг)" value={weight} onChange={setWeight} step="0.5" />}
          {params.includes('time') && <TimeField value={time} onChange={setTime} />}
          {params.includes('distance') && <NumberField label="Дистанция (км)" value={distance} onChange={setDistance} step="0.1" />}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDelete} style={btnStyle('danger')}>
            <IconTrash /> Удалить
          </button>
          <button onClick={handleSave} style={btnStyle('primary')}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
