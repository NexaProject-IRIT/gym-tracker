import React, { useState, useEffect, useRef } from 'react';
import type { WorkoutType, ParameterType } from '../../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS, DEFAULT_PARAMS_FOR_TYPE, PARAMETER_LABELS } from '../../../types/workout';
import { authedFetch } from '../../../utils/api';
import { SmallField } from './SmallField';
import { TimeField } from './TimeField';
import { TypeIcons } from './AccountStep';

export interface DraftExercise {
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

let counter = 0;
function genId() { return `tmp_${++counter}`; }

// --- DatePicker helpers ---

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

// --- DatePicker ---

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

  const pick = (d: Date) => { onChange(toISODate(d)); setOpen(false); };

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

// --- NotesField ---

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

// --- ExerciseStep ---

interface Props {
  selectedType: WorkoutType;
  workoutName: string;
  onWorkoutNameChange: (v: string) => void;
  workoutDate: string;
  onWorkoutDateChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  exercises: DraftExercise[];
  setExercises: React.Dispatch<React.SetStateAction<DraftExercise[]>>;
}

export const ExerciseStep: React.FC<Props> = ({
  selectedType, workoutName, onWorkoutNameChange, workoutDate, onWorkoutDateChange,
  notes, onNotesChange, exercises, setExercises,
}) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newExerciseId, setNewExerciseId] = useState<string | undefined>();
  const [newIsCustom, setNewIsCustom] = useState(true);
  const [newParams, setNewParams] = useState<ParameterType[]>(() => DEFAULT_PARAMS_FOR_TYPE[selectedType]);
  const [newSets, setNewSets] = useState('');
  const [newReps, setNewReps] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDistance, setNewDistance] = useState('');

  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(0);

  const c = WORKOUT_TYPE_COLORS[selectedType];
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

  const resetNew = () => {
    setNewName(''); setNewSets(''); setNewReps(''); setNewWeight(''); setNewTime(''); setNewDistance('');
    setNewExerciseId(undefined); setNewIsCustom(true);
    setSuggestions([]); setShowSuggestions(false);
    setNewParams(DEFAULT_PARAMS_FOR_TYPE[selectedType]);
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

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Название тренировки</label>
        <input value={workoutName} onChange={e => onWorkoutNameChange(e.target.value)}
          style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', borderRadius: 12, padding: '11px 16px', border: '1px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Дата</label>
        <DatePicker value={workoutDate} onChange={onWorkoutDateChange} accentColor={c.accent} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <IconNote /> Заметки
        </label>
        <NotesField value={notes} onChange={onNotesChange} accentColor={c.accent} />
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

      {adding ? (
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, border: '1px solid var(--border)', marginBottom: 10 }}>
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
  );
};
