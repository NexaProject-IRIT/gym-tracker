import React from 'react';
import type { Workout, WorkoutType } from '../../types/workout';
import { WORKOUT_TYPE_COLORS } from '../../types/workout';

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const TYPE_ORDER: WorkoutType[] = ['strength', 'cardio', 'flexibility', 'functional', 'custom'];

const TYPE_CHIP_LABEL: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Гибкость',
  functional: 'Функц.',
  custom: 'Прочее',
};

function pluralWorkouts(n: number): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'тренировок';
  if (mod10 === 1) return 'тренировка';
  if (mod10 >= 2 && mod10 <= 4) return 'тренировки';
  return 'тренировок';
}

export interface DayBar {
  count: number;
  intensity: number; // 0..1
  color: string;     // accent color of dominant type, '' for rest
}

export interface StripData {
  bars: DayBar[];       // exactly 7
  todayIndex: number;   // 0..6 (Mon..Sun)
  totalWorkouts: number;
  typeCounts: Array<{ type: WorkoutType; count: number }>;
}

interface Props extends Partial<StripData> {
  data?: StripData;
  workouts?: Workout[];
  title?: string;
}

// Compute strip data from raw workouts list, for the current week (Mon..Sun).
function computeWeekStrip(workouts: Workout[]): StripData {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - (dayOfWeek - 1));
  const todayIndex = dayOfWeek - 1;

  const perDay: Workout[][] = Array.from({ length: 7 }, () => []);
  for (const w of workouts) {
    if (!w.date) continue;
    const wd = new Date(w.date);
    const dayMs = 1000 * 60 * 60 * 24;
    const diff = Math.floor((wd.getTime() - monday.getTime()) / dayMs);
    if (diff >= 0 && diff < 7) perDay[diff].push(w);
  }

  const maxCount = Math.max(1, ...perDay.map(d => d.length));

  const bars: DayBar[] = perDay.map(dayWorkouts => {
    if (dayWorkouts.length === 0) return { count: 0, intensity: 0, color: '' };
    const typeMap: Partial<Record<WorkoutType, number>> = {};
    for (const w of dayWorkouts) {
      typeMap[w.type] = (typeMap[w.type] ?? 0) + 1;
    }
    const dominantType = Object.entries(typeMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] as WorkoutType;
    return {
      count: dayWorkouts.length,
      intensity: 0.45 + 0.55 * (dayWorkouts.length / maxCount),
      color: WORKOUT_TYPE_COLORS[dominantType].accent,
    };
  });

  const counts: Partial<Record<WorkoutType, number>> = {};
  for (const d of perDay) {
    for (const w of d) {
      counts[w.type] = (counts[w.type] ?? 0) + 1;
    }
  }

  const typeCounts = TYPE_ORDER
    .filter(t => (counts[t] ?? 0) > 0)
    .map(t => ({ type: t, count: counts[t]! }));

  const totalWorkouts = perDay.reduce((s, d) => s + d.length, 0);

  return { bars, todayIndex, totalWorkouts, typeCounts };
}

export const WeeklyActivityStrip: React.FC<Props> = ({ data, workouts, title = 'Эта неделя' }) => {
  const strip: StripData = data ?? (workouts ? computeWeekStrip(workouts) : { bars: [], todayIndex: -1, totalWorkouts: 0, typeCounts: [] });
  const { bars, todayIndex, totalWorkouts, typeCounts } = strip;

  if (bars.length !== 7) return null;

  return (
    <div className="was-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '18px 20px 16px',
      boxShadow: '0 20px 50px -26px rgba(0,0,0,0.8)',
    }}>
      <style>{`
        @media (max-width: 480px) {
          .was-card { padding: 14px 14px 12px !important; border-radius: 16px !important; }
        }
      `}</style>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 12, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: 'var(--ghost)',
        }}>
          {title}
        </span>
        {totalWorkouts > 0 && (
          <span style={{
            fontSize: 12.5, color: 'var(--ghost)', fontWeight: 500, textAlign: 'right',
          }}>
            <b style={{ color: 'var(--text)', fontWeight: 600 }}>{totalWorkouts}</b> {pluralWorkouts(totalWorkouts)}
          </span>
        )}
      </div>

      {/* 7-day bars */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: 8, height: 80,
      }}>
        {bars.map((bar, i) => {
          const isToday = i === todayIndex;
          const isRest = bar.count === 0;
          const trackHeight = isToday ? 56 : 46;
          const trackWidth = isToday ? 38 : 34;
          const fillHeight = isRest ? 0 : Math.round(bar.intensity * 100);
          const fillColor = isToday ? 'var(--accent)' : (bar.color || 'var(--ghost)');
          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              gap: 7, height: '100%',
            }}>
              <div style={{
                width: '100%', maxWidth: trackWidth, height: trackHeight,
                background: isRest ? 'transparent' : 'rgba(255,255,255,0.05)',
                border: isRest ? '1px dashed rgba(255,255,255,0.10)' : 'none',
                borderRadius: 8,
                display: 'flex', alignItems: 'flex-end',
                overflow: 'hidden', position: 'relative',
                boxShadow: isToday
                  ? '0 0 0 1.5px rgba(110,231,183,0.5), 0 0 18px -2px rgba(110,231,183,0.55)'
                  : 'none',
                transition: 'box-shadow .3s ease',
              }}>
                {!isRest && (
                  <div style={{
                    width: '100%',
                    height: `${fillHeight}%`,
                    background: fillColor,
                    borderRadius: 8,
                    transition: 'height .6s cubic-bezier(.4,0,.2,1)',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isToday ? 'var(--accent)' : 'var(--ghost)',
                letterSpacing: '0.02em',
                background: isToday ? 'rgba(110,231,183,0.14)' : 'transparent',
                padding: isToday ? '2px 8px' : 0,
                borderRadius: 999,
                transition: 'background .3s, color .3s',
              }}>
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Type chips */}
      {typeCounts.length > 0 && (
        <div className="was-chips" style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          marginTop: 16, paddingTop: 14,
          borderTop: '1px solid var(--border)',
          justifyContent: 'flex-start',
        }}>
          {typeCounts.map(({ type, count }) => {
            const c = WORKOUT_TYPE_COLORS[type];
            return (
              <span key={type} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 999, padding: '6px 12px',
                fontSize: 12.5, color: 'var(--ghost)', fontWeight: 500,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: c.accent, flexShrink: 0,
                }} />
                {TYPE_CHIP_LABEL[type]}
                <b style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 12.5, color: 'var(--text)', fontWeight: 600,
                }}>
                  {count}
                </b>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
