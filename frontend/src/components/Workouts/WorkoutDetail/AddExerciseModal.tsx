import React, { useState } from 'react';
import type { WorkoutExercise, WorkoutType, ParameterType } from '../../../types/workout';
import { PARAMETER_LABELS, DEFAULT_PARAMS_FOR_TYPE } from '../../../types/workout';
import { NumberField } from './NumberField';
import { TimeField } from './TimeField';

function btnStyle(): React.CSSProperties {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'opacity 0.15s',
    background: 'linear-gradient(135deg, #6ee7b7, #34d399)', color: '#064e3b',
  };
}

interface Props {
  workoutType: WorkoutType;
  onAdd: (ex: Omit<WorkoutExercise, 'id'>) => void;
  onClose: () => void;
}

export const AddExerciseModal: React.FC<Props> = ({ workoutType, onAdd, onClose }) => {
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
          {params.includes('sets') && <NumberField label="Подходы" value={sets} onChange={setSets} />}
          {params.includes('reps') && <NumberField label="Повторы" value={reps} onChange={setReps} />}
          {params.includes('weight') && <NumberField label="Вес (кг)" value={weight} onChange={setWeight} step="0.5" />}
          {params.includes('time') && <TimeField value={time} onChange={setTime} />}
          {params.includes('distance') && <NumberField label="Дистанция (км)" value={distance} onChange={setDistance} step="0.1" />}
        </div>

        <button onClick={handleAdd} disabled={!name.trim() || !params.length} style={btnStyle()}>
          Добавить упражнение
        </button>
      </div>
    </div>
  );
};
