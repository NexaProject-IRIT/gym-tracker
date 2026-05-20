// src/components/Workouts/WorkoutForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutType, WorkoutExercise, ParameterType } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS, DEFAULT_PARAMS_FOR_TYPE, PARAMETER_LABELS } from '../../types/workout';
import { authedFetch } from '../../utils/api';

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
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IconNote = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_RU_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toISODate(d: Date): string {
  return d.toLocaleDateString('en-CA');
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function humanDate(d: Date): string {
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return `Сегодня · ${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}`;
  if (isSameDay(d, yesterday)) return `Вчера · ${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]}`;
  return `${d.getDate()} ${MONTHS_RU_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

const DatePicker: React.FC<{ value: string; onChange: (v: string) => void; accentColor: string }> = ({ value, onChange, accentColor }) => {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);
  const [viewMonth, setViewMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const wrapRef = useRef<HTMLDivElement>(null);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!open) return;
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const days: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const pick = (d: Date) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'var(--surface)', color: 'var(--text)',
          borderRadius: 12, padding: '11px 16px',
          border: `1px solid ${open ? accentColor : 'var(--border)'}`,
          boxShadow: open ? `0 0 0 3px ${accentColor}22` : 'none',
          fontSize: 14, outline: 'none', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{ color: open ? accentColor : 'var(--text-faint)', display: 'flex', transition: 'color 0.15s' }}><IconCalendar /></span>
        <span style={{ flex: 1 }}>{humanDate(selected)}</span>
        <span style={{ color: 'var(--ghost)', display: 'flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--surface2)', borderRadius: 14, padding: 10,
          border: '1px solid var(--border2)',
          boxShadow: '0 14px 32px rgba(0,0,0,0.45)',
          zIndex: 100,
          animation: 'datepicker-in 0.16s ease-out',
        }}>
          <style>{`
            @keyframes datepicker-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
            .dp-cell:hover:not(.dp-sel) { background: var(--surface3) !important; }
            .dp-nav:hover { background: var(--surface3) !important; color: var(--text) !important; }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <button type="button" className="dp-nav"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--dim)', width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s, color 0.12s' }}
            ><IconChevronLeft /></button>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              {MONTHS_RU[viewMonth.getMonth()]} <span style={{ color: 'var(--dim)', fontWeight: 500 }}>{viewMonth.getFullYear()}</span>
            </div>
            <button type="button" className="dp-nav"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--dim)', width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s, color 0.12s' }}
            ><IconChevronRight /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 4 }}>
            {WEEKDAYS_RU.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 9, fontWeight: 600, padding: '2px 0',
                color: i >= 5 ? 'var(--ghost)' : 'var(--dim)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const isSel = isSameDay(d, selected);
              const isToday = isSameDay(d, today);
              const isWeekend = (d.getDay() === 0 || d.getDay() === 6);
              return (
                <button
                  key={i}
                  type="button"
                  className={`dp-cell${isSel ? ' dp-sel' : ''}`}
                  onClick={() => pick(d)}
                  style={{
                    height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSel ? accentColor : 'transparent',
                    color: isSel ? '#0a0a0a' : !inMonth ? 'var(--ghost)' : isWeekend ? 'var(--text-muted)' : 'var(--text)',
                    opacity: inMonth ? 1 : 0.55,
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                    fontWeight: isSel ? 700 : isToday ? 700 : 500,
                    position: 'relative', outline: 'none', fontFamily: 'inherit', padding: 0,
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {d.getDate()}
                  {isToday && !isSel && (
                    <span style={{
                      position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                      width: 3, height: 3, borderRadius: '50%', background: accentColor,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 5, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <button type="button"
              onClick={() => { const y = new Date(); y.setDate(y.getDate() - 1); pick(y); }}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.borderColor = 'var(--border2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >Вчера</button>
            <button type="button"
              onClick={() => pick(new Date())}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8,
                border: `1px solid ${accentColor}55`,
                background: `${accentColor}1f`, color: accentColor, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}33`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${accentColor}1f`; }}
            >Сегодня</button>
          </div>
        </div>
      )}
    </div>
  );
};

const NotesField: React.FC<{ value: string; onChange: (v: string) => void; accentColor: string }> = ({ value, onChange, accentColor }) => {
  const [focused, setFocused] = useState(false);
  const max = 500;
  return (
    <div style={{
      position: 'relative',
      background: 'var(--surface)',
      borderRadius: 12,
      border: `1px solid ${focused ? accentColor : 'var(--border)'}`,
      boxShadow: focused ? `0 0 0 3px ${accentColor}22` : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value.slice(0, max))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Как прошла тренировка, ощущения, цели…"
        rows={3}
        style={{
          width: '100%', background: 'transparent', color: 'var(--text)',
          borderRadius: 12, padding: '12px 14px 26px',
          border: 'none', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          resize: 'none', fontFamily: 'inherit', minHeight: 92, lineHeight: 1.5,
          display: 'block',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 8, right: 12, fontSize: 11,
        color: value.length >= max ? accentColor : 'var(--ghost)',
        fontVariantNumeric: 'tabular-nums', pointerEvents: 'none', userSelect: 'none',
        fontWeight: 500,
      }}>
        {value.length}/{max}
      </div>
    </div>
  );
};

export const WorkoutForm: React.FC<Props> = ({ onSave, onClose }) => {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [notes, setNotes] = useState('');
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
          const res = await authedFetch(`/exercises/search/?q=${encodeURIComponent(value.trim())}`);
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
      name: workoutName.trim(), type: selectedType, date: workoutDate, notes: notes.trim(),
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', position: 'sticky', top: 0,
        background: 'var(--bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', zIndex: 10,
      }}>
        <button
          onClick={step === 'type' ? onClose : () => setStep('type')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '6px 0' }}
        >
          <IconBack /> {step === 'type' ? 'Отмена' : 'Назад'}
        </button>
        <h2 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, margin: 0 }}>
          {step === 'type' ? 'Новая тренировка' : 'Упражнения'}
        </h2>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', padding: '28px 24px 120px', flex: 1 }}>
        {/* Step 1: Type selection */}
        {step === 'type' && (
          <>
            <p style={{ color: 'var(--dim)', fontSize: 14, margin: '0 0 20px' }}>Выберите тип тренировки</p>
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
                      <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{WORKOUT_TYPE_LABELS[type]}</div>
                      <div style={{ color: 'var(--dim)', fontSize: 12 }}>{TYPE_DESCRIPTIONS[type]}</div>
                    </div>
                    <span style={{ color: 'var(--ghost)' }}><IconChevron /></span>
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
              <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название тренировки</label>
              <input value={workoutName} onChange={e => setWorkoutName(e.target.value)}
                style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', borderRadius: 12, padding: '11px 16px', border: '1px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Дата</label>
              <DatePicker value={workoutDate} onChange={setWorkoutDate} accentColor={c.accent} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <IconNote /> Заметки
              </label>
              <NotesField value={notes} onChange={setNotes} accentColor={c.accent} />
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
                    background: 'var(--border)', border: '1px solid var(--border2)',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--ghost)', width: 18 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                        {!ex.isCustom && <span style={{ fontSize: 9, color: 'var(--accent)', background: 'var(--accent-a10)', padding: '1px 6px', borderRadius: 8 }}>из базы</span>}
                      </div>
                      <div style={{ color: 'var(--faint)', fontSize: 11, marginTop: 2 }}>
                        {ex.parameters.map(p => {
                          const val = ex[p as keyof DraftExercise];
                          if (!val || typeof val !== 'string') return null;
                          return `${val} ${PARAMETER_LABELS[p].unit}`;
                        }).filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button onClick={() => setExercises(prev => prev.filter(e => e.tempId !== ex.tempId))}
                      style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', padding: 4, display: 'flex' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--faint)')}
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New exercise form */}
            {adding ? (
              <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)', marginBottom: 10 }}>
                {/* Name input with autocomplete */}
                <div style={{ position: 'relative', marginBottom: 12 }} ref={suggestionsRef}>
                  <input autoFocus value={newName} onChange={e => handleNameChange(e.target.value)}
                    placeholder="Название упражнения..."
                    style={{ width: '100%', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: 'var(--surface)', borderRadius: 12, overflow: 'hidden',
                      border: '1px solid var(--border2)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      maxHeight: 200, overflowY: 'auto', marginTop: 4,
                    }}>
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => selectSuggestion(s)}
                          style={{
                            width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                          {s.equipment && <span style={{ color: 'var(--faint)', fontSize: 11 }}>{s.equipment}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!newIsCustom && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Выбрано из базы знаний
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {allParams.map(p => (
                    <button key={p} onClick={() => toggleParam(p)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                      background: newParams.includes(p) ? 'var(--accent-a10)' : 'var(--border)',
                      color: newParams.includes(p) ? 'var(--accent)' : 'var(--dim)',
                      outline: newParams.includes(p) ? '1px solid var(--accent-a30)' : '1px solid var(--border2)',
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
                  <button onClick={resetNew} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--border)', color: 'var(--dim)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Отмена
                  </button>
                  <button onClick={addExercise} disabled={!newName.trim() || !newParams.length} style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: newName.trim() && newParams.length ? 'var(--accent-a10)' : 'var(--border)',
                    color: newName.trim() && newParams.length ? 'var(--accent)' : 'var(--ghost)',
                    outline: '1px solid var(--accent-a20)', fontSize: 13, fontWeight: 600,
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
                  border: '1px dashed var(--border2)', background: 'none', color: 'var(--faint)',
                  cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(110,231,183,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--faint)'; }}
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
          background: 'linear-gradient(to top, var(--bg) 50%, transparent)',
          zIndex: 20,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button
              onClick={handleSave}
              disabled={!workoutName.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: workoutName.trim() && c ? `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` : 'var(--border)',
                color: workoutName.trim() ? '#0a0a0a' : 'var(--ghost)',
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
  const btnS: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--border2)', color: 'var(--muted)', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 10, color: 'var(--faint)' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{ padding: '2px 7px', fontSize: 10, border: 'none', cursor: 'pointer', fontWeight: 500, background: unit === u ? 'var(--accent-a20)' : 'transparent', color: unit === u ? 'var(--accent)' : 'var(--faint)' }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', padding: '3px 4px' }}>
        <button style={btnS} onClick={dec}>−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
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
  const btnS: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--border2)', color: 'var(--muted)', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.1s' };
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--faint)', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', padding: '3px 4px' }}>
        <button style={btnS} onClick={e => { e.preventDefault(); dec(); }}>−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={e => { e.preventDefault(); inc(); }}>+</button>
      </div>
    </div>
  );
};
