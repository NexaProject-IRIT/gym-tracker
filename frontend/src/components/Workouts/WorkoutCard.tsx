import React from 'react';
import type { Workout, WorkoutType } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../types/workout';
import { WorkoutMenu } from './WorkoutMenu';
import { WORKOUT_TYPE_ICON_PATHS } from '../../constants/workoutTypes';

const WorkoutTypeIcon: React.FC<{ type: WorkoutType; color: string; size?: number }> = ({ type, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {WORKOUT_TYPE_ICON_PATHS[type].map((d, i) => (
      <path key={i} d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    ))}
  </svg>
);

const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
  </svg>
);

function formatDate(iso: string) {
  const [y, m, day] = iso.slice(0, 10).split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return {
    day: d.toLocaleDateString('ru-RU', { day: '2-digit' }),
    month: d.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', ''),
    year: d.getFullYear().toString(),
  };
}

interface Props {
  workout: Workout;
  isMenuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onRepeat: () => void;
  onDelete: () => void;
}

const skBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
  backgroundSize: '200% 100%',
  animation: 'sk-shimmer 1.4s ease-in-out infinite',
  borderRadius: 6,
};

export const WorkoutCardSkeleton: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'stretch', borderRadius: 16,
    border: '1px solid var(--border)', background: 'var(--surface)',
    position: 'relative',
  }}>
    <div style={{ width: 4, borderRadius: '16px 0 0 16px', background: 'var(--border2)', flexShrink: 0 }} />
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '16px 14px', minWidth: 52, flexShrink: 0,
    }}>
      <div style={{ ...skBase, width: 24, height: 22, borderRadius: 4 }} />
      <div style={{ ...skBase, width: 20, height: 11, marginTop: 4 }} />
      <div style={{ ...skBase, width: 28, height: 10, marginTop: 3 }} />
    </div>
    <div style={{ width: 1, margin: '12px 0', background: 'var(--border)', flexShrink: 0 }} />
    <div style={{ flex: 1, padding: '14px 12px', minWidth: 0 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ ...skBase, width: 72, height: 18, borderRadius: 20 }} />
      </div>
      <div style={{ ...skBase, width: '72%', height: 14, marginBottom: 7 }} />
      <div style={{ ...skBase, width: '42%', height: 11 }} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0 }}>
      <div style={{ ...skBase, width: 32, height: 32, borderRadius: 8 }} />
    </div>
  </div>
);

export const WorkoutCard: React.FC<Props> = ({ workout, isMenuOpen, onSelect, onMenuToggle, onRepeat, onDelete }) => {
  const c = WORKOUT_TYPE_COLORS[workout.type];
  const d = formatDate(workout.date);
  const exCount = workout.exercise_count ?? workout.exercises?.length ?? 0;

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'stretch', borderRadius: 16,
        border: `1px solid ${c.border}`,
        background: `linear-gradient(135deg, ${c.bg} 0%, var(--surface) 100%)`,
        cursor: 'pointer', overflow: 'visible', position: 'relative',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ width: 4, borderRadius: '16px 0 0 16px', background: c.accent, flexShrink: 0 }} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px 14px', minWidth: 52, flexShrink: 0,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{d.day}</span>
        <span style={{ fontSize: 11, color: 'var(--dim)', marginTop: 2, textTransform: 'capitalize' }}>{d.month}</span>
        <span style={{ fontSize: 10, color: 'var(--ghost)', marginTop: 1 }}>{d.year}</span>
      </div>
      <div style={{ width: 1, margin: '12px 0', background: 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px 12px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <WorkoutTypeIcon type={workout.type} color={c.accent} size={13} />
          <span style={{
            fontSize: 11, fontWeight: 600, color: c.accent,
            background: c.bg, border: `1px solid ${c.border}`,
            borderRadius: 20, padding: '1px 8px',
          }}>
            {WORKOUT_TYPE_LABELS[workout.type]}
          </span>
        </div>
        <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {workout.name}
        </p>
        {workout.notes ? (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workout.notes.length > 60 ? workout.notes.slice(0, 60) + '…' : workout.notes}
          </p>
        ) : exCount > 0 && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ghost)' }}>
            {exCount} упражн.
          </p>
        )}
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', padding: '0 12px', position: 'relative', flexShrink: 0, zIndex: isMenuOpen ? 51 : 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onMenuToggle}
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isMenuOpen ? 'var(--border2)' : 'transparent',
            color: 'var(--dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border2)')}
          onMouseLeave={e => (e.currentTarget.style.background = isMenuOpen ? 'var(--border2)' : 'transparent')}
        >
          <IconDots />
        </button>
        {isMenuOpen && (
          <WorkoutMenu
            onEdit={onSelect}
            onRepeat={onRepeat}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
};
