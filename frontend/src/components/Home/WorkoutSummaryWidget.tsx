import React from 'react';
import type { Workout } from '../../types/workout';
import { WORKOUT_TYPE_LABELS } from '../../types/workout';

const WEEKDAY_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const fmtDateLabel = (d: Date): string =>
  `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}, ${WEEKDAY_SHORT[d.getDay()]}`;

const padNum = (n: number) => String(n).padStart(2, '0');

interface Props {
  lastWorkout: Workout | null;
  weeklyStreak: number;
  onStart: () => void;
}

export const WorkoutSummaryWidget: React.FC<Props> = ({ lastWorkout, weeklyStreak, onStart }) => {
  const today = new Date();
  const streakCapped = Math.min(weeklyStreak, 4);
  const exercisesCount = lastWorkout?.exercises?.length ?? 0;

  const lastDateLabel = lastWorkout
    ? `${new Date(lastWorkout.date).getDate()} ${MONTH_SHORT[new Date(lastWorkout.date).getMonth()]}`
    : '';
  const lastTypeLabel = lastWorkout ? WORKOUT_TYPE_LABELS[lastWorkout.type].toLowerCase() : '';

  return (
    <>
      <style>{`
        @keyframes wsw-ping {
          0%       { box-shadow: 0 0 0 0 rgba(110,231,183,0.45); }
          70%,100% { box-shadow: 0 0 0 7px rgba(110,231,183,0); }
        }
        .wsw-pulse-dot { animation: wsw-ping 2.4s ease-out infinite; }
        .wsw-start { transition: transform .12s ease, background .2s ease, box-shadow .2s ease; }
        .wsw-start:hover  { background: #86eec5; }
        .wsw-start:active { transform: scale(0.975); }
      `}</style>

      <div style={{
        width: '100%',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 28,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow:
          '0 24px 60px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
      }}>

        {/* top meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{
              fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--faint)', fontWeight: 600,
            }}>
              Сегодня
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 13, color: 'var(--muted)', fontWeight: 500,
            }}>
              {fmtDateLabel(today)}
            </span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-a12)',
            borderRadius: 999,
            padding: '6px 12px 6px 10px',
          }}>
            <span
              className="wsw-pulse-dot"
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--accent)',
              letterSpacing: '0.02em',
            }}>
              {lastWorkout ? 'Готова к старту' : 'Запланирована'}
            </span>
          </div>
        </div>

        {/* status headline */}
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 26, fontWeight: 700,
            letterSpacing: '-0.01em', lineHeight: 1.1,
            color: 'var(--text)',
          }}>
            Тренировка сегодня
          </h1>
          <p style={{
            margin: '6px 0 0',
            fontSize: 14, color: 'var(--muted)',
          }}>
            {lastWorkout
              ? `Последняя · ${lastTypeLabel} — ${exercisesCount} упражнений`
              : 'Создай первую тренировку и начни вести историю'}
          </p>
        </div>

        {/* streak block */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingTop: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <b style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 46, fontWeight: 700, lineHeight: 0.9,
              color: 'var(--accent)', letterSpacing: '-0.02em',
            }}>
              {padNum(weeklyStreak)}
            </b>
            <span style={{
              display: 'flex', flexDirection: 'column',
              lineHeight: 1.15, fontSize: 13, color: 'var(--muted)', fontWeight: 500,
            }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {weeklyStreak === 1 ? 'неделя' : 'недели'}
              </span>
              <span>подряд</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 7 }} aria-label="streak weeks">
            {[0, 1, 2, 3].map(i => (
              <span
                key={i}
                style={{
                  width: 9, height: 34, borderRadius: 6,
                  background: i < streakCapped ? 'var(--accent)' : 'var(--surface2)',
                  boxShadow: i < streakCapped ? '0 0 12px -2px rgba(110,231,183,0.5)' : 'none',
                  transition: 'background .3s, box-shadow .3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* last workout */}
        {lastWorkout && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
              <span style={{
                fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--faint)', fontWeight: 600,
              }}>
                Последняя тренировка
              </span>
              <span style={{
                fontSize: 15, fontWeight: 600, color: 'var(--text)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {lastWorkout.name || lastTypeLabel}
              </span>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 12, color: 'var(--muted)', fontWeight: 500,
              }}>
                <span>{lastDateLabel}</span>
                <i style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--faint)' }} />
                <span>{lastTypeLabel}</span>
              </span>
            </div>
            <div style={{
              flexShrink: 0,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 13, fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-a12)',
              borderRadius: 10,
              padding: '8px 11px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}>
              {exercisesCount}
              <small style={{
                display: 'block', fontSize: 9, color: 'var(--faint)',
                fontWeight: 500, letterSpacing: '0.08em',
              }}>
                УПРАЖН
              </small>
            </div>
          </div>
        )}

        {/* start button */}
        <button
          onClick={onStart}
          className="wsw-start"
          style={{
            width: '100%', border: 'none', cursor: 'pointer',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontSize: 16, fontWeight: 700,
            letterSpacing: '0.01em',
            borderRadius: 16,
            padding: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 10px 24px -10px rgba(110,231,183,0.6)',
          }}
        >
          <span style={{
            width: 0, height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '9px solid currentColor',
          }} />
          Начать
        </button>
      </div>
    </>
  );
};
