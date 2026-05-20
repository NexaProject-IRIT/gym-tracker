import React from 'react';
import type { Workout, WorkoutType } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../types/workout';

interface Props {
  workouts: Workout[];
}

export const StatsRow: React.FC<Props> = ({ workouts }) => (
  <div style={{
    display: 'flex', gap: 12, padding: '0 32px 20px',
    maxWidth: 900, width: '100%', flexWrap: 'wrap', margin: '0 auto',
  }}>
    {(['strength', 'cardio', 'flexibility', 'functional'] as WorkoutType[]).map(type => {
      const count = workouts.filter(w => w.type === type).length;
      if (!count) return null;
      const c = WORKOUT_TYPE_COLORS[type];
      return (
        <div key={type} style={{
          padding: '10px 16px', borderRadius: 12, border: `1px solid ${c.border}`,
          background: c.bg, minWidth: 80,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 11, marginTop: 3, color: c.accent, fontWeight: 500 }}>
            {WORKOUT_TYPE_LABELS[type].split('/')[0].trim()}
          </div>
        </div>
      );
    })}
  </div>
);
