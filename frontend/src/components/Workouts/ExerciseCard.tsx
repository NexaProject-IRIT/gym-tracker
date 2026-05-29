import React from 'react';
import type { WorkoutExercise, ParameterType } from '../../types/workout';

interface Stat {
  value: string;
  unit?: string;
  label: string;
}

const fmtTime = (sec: number): { value: string; unit: string } => {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? { value: `${m}:${String(s).padStart(2, '0')}`, unit: 'мин' } : { value: String(m), unit: 'мин' };
  }
  return { value: String(sec), unit: 'сек' };
};

const buildStats = (ex: WorkoutExercise): Stat[] => {
  const stats: Stat[] = [];
  const has = (p: ParameterType) => ex.parameters.includes(p);

  if (has('sets') && ex.sets != null && ex.sets > 0) {
    stats.push({ value: String(ex.sets), label: ex.sets === 1 ? 'Подход' : 'Подх' });
  }
  if (has('reps') && ex.reps != null && ex.reps > 0) {
    stats.push({ value: String(ex.reps), label: 'Повтор' });
  }
  if (has('weight') && ex.weight != null && ex.weight > 0) {
    stats.push({ value: String(ex.weight), unit: 'кг', label: 'Вес' });
  }
  if (has('time') && ex.time != null && ex.time > 0) {
    const t = fmtTime(ex.time);
    stats.push({ value: t.value, unit: t.unit, label: 'Время' });
  }
  if (has('distance') && ex.distance != null && ex.distance > 0) {
    stats.push({ value: String(ex.distance), unit: 'км', label: 'Дистанция' });
  }
  return stats.slice(0, 3);
};

interface Props {
  exercise: WorkoutExercise;
  index: number;
  category: string;
  /** Запросить конкретное число завершённых подходов (бэк сам пересчитает isDone) */
  onSetsDone: (setsDone: number) => void;
  onShowInfo?: () => void;
}

export const ExerciseCard: React.FC<Props> = ({ exercise, index, category, onSetsDone, onShowInfo }) => {
  const totalSets = (exercise.parameters.includes('sets') && exercise.sets && exercise.sets > 0)
    ? exercise.sets
    : 1;

  // Если бэк ещё не прислал setsDone (старые записи) — выводим из isDone
  const doneSets = exercise.setsDone != null
    ? Math.max(0, Math.min(exercise.setsDone, totalSets))
    : (exercise.isDone ? totalSets : 0);
  const isDone = doneSets >= totalSets;

  const onMainClick = () => {
    if (isDone) {
      // Полностью сделано → сброс
      onSetsDone(0);
    } else {
      // Следующий подход
      onSetsDone(doneSets + 1);
    }
  };

  const ringR = 24;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - doneSets / totalSets);

  const stats = buildStats(exercise);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isDone ? 'var(--accent-a20)' : 'var(--border)'}`,
        borderRadius: 22,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 20px 50px -24px rgba(0,0,0,0.4)',
        transition: 'border-color .2s ease',
      }}
    >
      {/* head: order + category + name + ring */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <span style={{
            fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--faint)', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              color: 'var(--dim)',
            }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 220,
            }}>
              {category}
            </span>
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 240,
          }}>
            {exercise.name}
            {exercise.isPR && (
              <span style={{
                flexShrink: 0, fontSize: 10, fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.28)',
                borderRadius: 5, padding: '1px 6px',
                letterSpacing: '0.03em',
              }}>
                PR
              </span>
            )}
          </span>
        </div>

        {/* progress ring */}
        <div
          style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}
          aria-label={`${doneSets} of ${totalSets} sets complete`}
        >
          <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="28" cy="28" r={ringR}
              fill="none" strokeWidth="5"
              stroke="var(--border2)"
            />
            <circle
              cx="28" cy="28" r={ringR}
              fill="none" strokeWidth="5"
              strokeLinecap="round"
              stroke="var(--accent)"
              strokeDasharray={ringC}
              strokeDashoffset={ringOffset}
              style={{
                transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)',
                filter: doneSets > 0 ? 'drop-shadow(0 0 5px rgba(110,231,183,0.4))' : 'none',
              }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: 13, fontWeight: 600,
          }}>
            <b style={{ color: 'var(--accent)' }}>{doneSets}</b>
            <span style={{ color: 'var(--faint)' }}>/{totalSets}</span>
          </div>
        </div>
      </div>

      {/* stats strip */}
      {stats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '13px 10px',
                textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 3,
                borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <span style={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 20, fontWeight: 700,
                letterSpacing: '-0.01em', lineHeight: 1,
                color: 'var(--text)',
              }}>
                {s.value}
                {s.unit && (
                  <small style={{
                    fontSize: 11, color: 'var(--faint)',
                    fontWeight: 500, marginLeft: 2,
                  }}>
                    {s.unit}
                  </small>
                )}
              </span>
              <span style={{
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--faint)', fontWeight: 600,
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* foot: set dots + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }} aria-label="set progress">
          {Array.from({ length: totalSets }).map((_, i) => {
            const done = i < doneSets;
            return (
              <span
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: done ? 'var(--accent)' : 'var(--border2)',
                  boxShadow: done ? '0 0 8px -1px rgba(110,231,183,0.55)' : 'none',
                  transition: 'background .3s, box-shadow .3s',
                }}
              />
            );
          })}
          {exercise.isCustom && (
            <span style={{
              marginLeft: 6,
              fontSize: 11, color: 'var(--accent)', fontWeight: 500,
              background: 'var(--accent-a10)', borderRadius: 4, padding: '2px 6px',
            }}>
              кастом
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onShowInfo && !exercise.isCustom && (
            <button
              onClick={onShowInfo}
              title="База знаний"
              style={{
                width: 32, height: 32, borderRadius: 10,
                border: '1px solid var(--border2)',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <button
            onClick={onMainClick}
            className="excard-logbtn"
            style={{
              border: 'none', cursor: 'pointer',
              background: isDone ? 'transparent' : 'var(--accent)',
              color: isDone ? 'var(--accent)' : 'var(--accent-fg)',
              boxShadow: isDone ? '0 0 0 1.5px var(--accent) inset' : 'none',
              fontSize: 14, fontWeight: 700,
              borderRadius: 12,
              padding: '11px 18px',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'transform .12s ease, background .2s ease, box-shadow .2s ease',
            }}
          >
            <span style={{
              width: 13, height: 13, position: 'relative',
              display: 'inline-block',
            }}>
              <span style={{
                position: 'absolute', left: 1, top: 5,
                width: 5, height: 8,
                borderRight: '2px solid currentColor',
                borderBottom: '2px solid currentColor',
                transform: 'rotate(45deg)',
              }} />
            </span>
            {isDone ? 'Сброс' : 'Подход'}
          </button>
        </div>
      </div>

      <style>{`
        .excard-logbtn:hover  { background: #86eec5; color: var(--accent-fg); }
        .excard-logbtn:active { transform: scale(0.96); }
      `}</style>
    </div>
  );
};
