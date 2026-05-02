// src/components/Workouts/WorkoutForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutType, WorkoutExercise, ParameterType } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS, DEFAULT_PARAMS_FOR_TYPE, PARAMETER_LABELS } from '../../types/workout';

interface Props {
  onSave: (data: { name: string; type: WorkoutType; date: string; notes: string; exercises: Omit<WorkoutExercise, 'id'>[] }) => void;
  onClose: () => void;
}

type Step = 'type' | 'exercises';

interface DraftExercise {
  tempId: string;
  name: string;
  exerciseId?: string;
  isCustom: boolean;
  parameters: ParameterType[];
  sets?: string; reps?: string; weight?: string; time?: string; distance?: string;
}

interface ExerciseSuggestion {
  id: string;
  exerciseId?: string;
  name: string;
  equipment: string;
  targetMuscles: string[];
}

const TypeIcons: Record<WorkoutType, React.ReactNode> = {
  strength: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  cardio: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  flexibility: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c-1.5 4-4 6-4 9a4 4 0 008 0c0-3-2.5-5-4-9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15v6M9 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  functional: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  custom: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const TYPE_DESCRIPTIONS: Record<WorkoutType, string> = {
  strength: 'Базовые упражнения, железо, прогрессивная перегрузка',
  cardio: 'Бег, велосипед, эллипс, плавание',
  flexibility: 'Йога, стретчинг, мобильность',
  functional: 'Кроссфит, интервалы, функциональный тренинг',
  custom: 'Своя программа — любые параметры',
};

let counter = 0;
function genId() { return `tmp_${++counter}`; }

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WorkoutForm: React.FC<Props> = ({ onSave, onClose }) => {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [notes] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [adding, setAdding] = useState(false);

  const [newName, setNewName] = useState('');
  const [newExerciseId, setNewExerciseId] = useState<string | undefined>();
  const [newIsCustom, setNewIsCustom] = useState(true);
  const [newParams, setNewParams] = useState<ParameterType[]>([]);
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDistance, setNewDistance] = useState('');

  // Autocomplete
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(0);

  const c = selectedType ? WORKOUT_TYPE_COLORS[selectedType] : null;
  const allParams: ParameterType[] = ['sets', 'reps', 'weight', 'time', 'distance'];

  const handleNameChange = (value: string) => {
    setNewName(value);
    setNewExerciseId(undefined);
    setNewIsCustom(true);

    clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = window.setTimeout(async () => {
        try {
          const res = await fetch(`/exercises/search/?q=${encodeURIComponent(value.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
          }
        } catch {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: ExerciseSuggestion) => {
    setNewName(s.name);
    setNewExerciseId(s.exerciseId ?? s.id);
    setNewIsCustom(false);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectType = (type: WorkoutType) => {
    setSelectedType(type);
    setNewParams(DEFAULT_PARAMS_FOR_TYPE[type]);
    const d = new Date();
    setWorkoutName(`${WORKOUT_TYPE_LABELS[type]} ${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`);
    setStep('exercises');
  };

  const resetNew = () => {
    setNewName(''); setNewSets(''); setNewReps(''); setNewWeight(''); setNewTime(''); setNewDistance('');
    setNewExerciseId(undefined); setNewIsCustom(true);
    setSuggestions([]); setShowSuggestions(false);
    if (selectedType) setNewParams(DEFAULT_PARAMS_FOR_TYPE[selectedType]);
    setAdding(false);
  };

  const addExercise = () => {
    if (!newName.trim() || !newParams.length) return;
    setExercises(prev => [...prev, {
      tempId: genId(), name: newName.trim(), parameters: newParams,
      exerciseId: newExerciseId, isCustom: newIsCustom,
      sets: newSets, reps: newReps, weight: newWeight, time: newTime, distance: newDistance,
    }]);
    resetNew();
  };

  const toggleParam = (p: ParameterType) =>
    setNewParams(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSave = () => {
    if (!selectedType || !workoutName.trim()) return;
    onSave({
      name: workoutName.trim(), type: selectedType, date: new Date().toISOString(), notes: notes.trim(),
      exercises: exercises.map(e => ({
        name: e.name,
        exerciseId: e.exerciseId,
        isCustom: e.isCustom,
        parameters: e.parameters,
        sets: e.parameters.includes('sets') && e.sets ? parseInt(e.sets) : undefined,
        reps: e.parameters.includes('reps') && e.reps ? parseInt(e.reps) : undefined,
        weight: e.parameters.includes('weight') && e.weight ? parseFloat(e.weight) : undefined,
        time: e.parameters.includes('time') && e.time ? parseInt(e.time) : undefined,
        distance: e.parameters.includes('distance') && e.distance ? parseFloat(e.distance) : undefined,
      })),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#111318', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', position: 'sticky', top: 0,
        background: 'rgba(17,19,24,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10,
      }}>
        <button
          onClick={step === 'type' ? onClose : () => setStep('type')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '6px 0' }}
        >
          <IconBack /> {step === 'type' ? 'Отмена' : 'Назад'}
        </button>
        <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: 0 }}>
          {step === 'type' ? 'Новая тренировка' : 'Упражнения'}
        </h2>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', padding: '28px 24px 120px', flex: 1 }}>
        {/* Step 1: Type selection */}
        {step === 'type' && (
          <>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Выберите тип тренировки</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(Object.keys(TypeIcons) as WorkoutType[]).map(type => {
                const col = WORKOUT_TYPE_COLORS[type];
                return (
                  <button
                    key={type}
                    onClick={() => selectType(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', borderRadius: 16,
                      border: `1px solid ${col.border}`, background: col.bg,
                      cursor: 'pointer', textAlign: 'left', transition: 'transform 0.12s, box-shadow 0.12s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ color: col.accent }}>{TypeIcons[type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{WORKOUT_TYPE_LABELS[type]}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{TYPE_DESCRIPTIONS[type]}</div>
                    </div>
                    <span style={{ color: '#334155' }}><IconChevron /></span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Exercises */}
        {step === 'exercises' && selectedType && c && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название тренировки</label>
              <input value={workoutName} onChange={e => setWorkoutName(e.target.value)}
                style={{ width: '100%', background: '#1a1d24', color: '#f1f5f9', borderRadius: 12, padding: '11px 16px', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: c.bg, border: `1px solid ${c.border}`, color: c.accent,
              }}>
                <span style={{ display: 'flex' }}>{TypeIcons[selectedType]}</span>
                {WORKOUT_TYPE_LABELS[selectedType]}
              </span>
            </div>

            {/* Added exercises */}
            {exercises.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {exercises.map((ex, i) => (
                  <div key={ex.tempId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <span style={{ fontSize: 11, color: '#334155', width: 18 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                        {!ex.isCustom && <span style={{ fontSize: 9, color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '1px 6px', borderRadius: 8 }}>из базы</span>}
                      </div>
                      <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                        {ex.parameters.map(p => {
                          const val = ex[p as keyof DraftExercise];
                          if (!val || typeof val !== 'string') return null;
                          return `${val} ${PARAMETER_LABELS[p].unit}`;
                        }).filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button onClick={() => setExercises(prev => prev.filter(e => e.tempId !== ex.tempId))}
                      style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New exercise form */}
            {adding ? (
              <div style={{ background: '#1a1d24', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }}>
                {/* Name input with autocomplete */}
                <div style={{ position: 'relative', marginBottom: 12 }} ref={suggestionsRef}>
                  <input autoFocus value={newName} onChange={e => handleNameChange(e.target.value)}
                    placeholder="Название упражнения..."
                    style={{ width: '100%', background: '#21252e', color: '#f1f5f9', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: '#1e2330', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      maxHeight: 200, overflowY: 'auto', marginTop: 4,
                    }}>
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => selectSuggestion(s)}
                          style={{
                            width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                          {s.equipment && <span style={{ color: '#475569', fontSize: 11 }}>{s.equipment}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!newIsCustom && (
                  <div style={{ fontSize: 11, color: '#6ee7b7', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Выбрано из базы знаний
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {allParams.map(p => (
                    <button key={p} onClick={() => toggleParam(p)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: newParams.includes(p) ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.04)',
                      color: newParams.includes(p) ? '#6ee7b7' : '#64748b',
                      outline: newParams.includes(p) ? '1px solid rgba(110,231,183,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                      {PARAMETER_LABELS[p].label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 12, alignItems: 'end' }}>
                  {newParams.includes('sets') && <SmallField label="Подходы" value={newSets} onChange={setNewSets} />}
                  {newParams.includes('reps') && <SmallField label="Повторы" value={newReps} onChange={setNewReps} />}
                  {newParams.includes('weight') && <SmallField label="Вес кг" value={newWeight} onChange={setNewWeight} step="0.5" />}
                  {newParams.includes('time') && <TimeField value={newTime} onChange={setNewTime} />}
                  {newParams.includes('distance') && <SmallField label="Дист. км" value={newDistance} onChange={setNewDistance} step="1" />}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={resetNew} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Отмена
                  </button>
                  <button onClick={addExercise} disabled={!newName.trim() || !newParams.length} style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: newName.trim() && newParams.length ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.04)',
                    color: newName.trim() && newParams.length ? '#6ee7b7' : '#334155',
                    outline: '1px solid rgba(110,231,183,0.2)', fontSize: 13, fontWeight: 600,
                  }}>
                    Добавить
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14, marginBottom: 10,
                  border: '1px dashed rgba(255,255,255,0.1)', background: 'none', color: '#475569',
                  cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,231,183,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#6ee7b7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
              >
                <IconPlus /> Добавить упражнение
              </button>
            )}
          </>
        )}
      </div>

      {/* Save button */}
      {step === 'exercises' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 24px 28px',
          background: 'linear-gradient(to top, #111318 50%, transparent)',
          zIndex: 20,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button
              onClick={handleSave}
              disabled={!workoutName.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: workoutName.trim() && c ? `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` : 'rgba(255,255,255,0.05)',
                color: workoutName.trim() ? '#0a0a0a' : '#334155',
                fontWeight: 700, fontSize: 14, transition: 'opacity 0.15s',
                boxShadow: workoutName.trim() && c ? `0 4px 20px ${c.accent}33` : 'none',
              }}
            >
              Сохранить тренировку
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const TimeField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [unit, setUnit] = React.useState<'sec' | 'min'>('sec');
  const storedSec = parseInt(value || '0');
  const displayVal = unit === 'min' ? Math.round(storedSec / 60) : storedSec;
  const dec = (e: React.MouseEvent) => { e.preventDefault(); const n = Math.max(0, displayVal - 1); onChange(String(unit === 'min' ? n * 60 : n)); };
  const inc = (e: React.MouseEvent) => { e.preventDefault(); const n = displayVal + 1; onChange(String(unit === 'min' ? n * 60 : n)); };
  const handleChange = (raw: string) => { const n = parseInt(raw) || 0; onChange(String(unit === 'min' ? n * 60 : n)); };
  const switchUnit = (e: React.MouseEvent, u: 'sec' | 'min') => { e.preventDefault(); setUnit(u); };
  const btnS: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 10, color: '#475569' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{ padding: '2px 7px', fontSize: 10, border: 'none', cursor: 'pointer', fontWeight: 500, background: unit === u ? 'rgba(110,231,183,0.2)' : 'transparent', color: unit === u ? '#6ee7b7' : '#475569' }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#21252e', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', padding: '3px 4px' }}>
        <button style={btnS} onClick={dec}>−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: '#f1f5f9', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}>+</button>
      </div>
    </div>
  );
};

const SmallField: React.FC<{ label: string; value: string; onChange: (v: string) => void; step?: string }> = ({ label, value, onChange, step }) => {
  const stepNum = parseFloat(step ?? '1') || 1;
  const isInt = !step || step === '1';
  const fmt = (n: number) => isInt ? String(Math.round(n)) : String(parseFloat(n.toFixed(1)));
  const dec = () => onChange(fmt(Math.max(0, parseFloat(value || '0') - stepNum)));
  const inc = () => onChange(fmt(parseFloat(value || '0') + stepNum));
  const btnS: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' };
  return (
    <div>
      <label style={{ fontSize: 10, color: '#475569', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#21252e', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', padding: '3px 4px' }}>
        <button style={btnS} onClick={e => { e.preventDefault(); dec(); }}>−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: '#f1f5f9', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={e => { e.preventDefault(); inc(); }}>+</button>
      </div>
    </div>
  );
};
