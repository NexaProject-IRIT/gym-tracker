import React from 'react';
import type { Workout } from '../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../types/workout';
import { WorkoutMenu } from './WorkoutMenu';

const IconDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
  </svg>
);

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="18" y2="12"/>
    <polyline points="12 6 19 12 12 18"/>
  </svg>
);

function formatDateParts(iso: string): { dateStr: string; weekday: string } {
  const [y, m, day] = iso.slice(0, 10).split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return {
    dateStr: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    weekday: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
  };
}

interface Props {
  workout: Workout;
  isMenuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onEdit: () => void;
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
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--border2)',
    borderRadius: 16,
    padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 10,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ ...skBase, width: 80, height: 22, borderRadius: 999 }} />
      <div style={{ ...skBase, width: 90, height: 14, borderRadius: 4 }} />
    </div>
    <div style={{ ...skBase, width: '72%', height: 18 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ ...skBase, width: 88, height: 22, borderRadius: 8 }} />
      <div style={{ ...skBase, width: 30, height: 30, borderRadius: 9 }} />
    </div>
  </div>
);

export const WorkoutCard: React.FC<Props> = ({ workout, isMenuOpen, onSelect, onMenuToggle, onEdit, onRepeat, onDelete }) => {
  const c = WORKOUT_TYPE_COLORS[workout.type];
  const exCount = workout.exercise_count ?? workout.exercises?.length ?? 0;
  const { dateStr, weekday } = formatDateParts(workout.date);
  const typeLabel = WORKOUT_TYPE_LABELS[workout.type];

  // Hover: lift + colored glow. IMPORTANT: only touch top/right/bottom border
  // colors so the colored left border stays visible.
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'translateY(-3px)';
    el.style.borderTopColor = c.border;
    el.style.borderRightColor = c.border;
    el.style.borderBottomColor = c.border;
    el.style.boxShadow = `0 18px 38px -16px rgba(0,0,0,0.75), 0 0 22px -8px ${c.accent}`;
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'none';
    el.style.borderTopColor = 'var(--border)';
    el.style.borderRightColor = 'var(--border)';
    el.style.borderBottomColor = 'var(--border)';
    el.style.boxShadow = 'none';
  };

  return (
    <div
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${c.accent}`,
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 9,
        cursor: 'pointer',
        transition: 'transform .2s ease, box-shadow .25s ease, border-top-color .25s ease, border-right-color .25s ease, border-bottom-color .25s ease',
        zIndex: isMenuOpen ? 51 : 'auto',
      }}
    >
      {/* TOP: badge | date · weekday | 3-dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: c.bg, color: c.accent,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
          padding: '4px 10px', borderRadius: 999,
          maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          minWidth: 0, flexShrink: 1,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: c.accent, flexShrink: 0,
          }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{typeLabel}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 12, color: 'var(--ghost)',
            fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            {dateStr}
            <span style={{ color: 'var(--faint)', margin: '0 5px' }}>·</span>
            {weekday}
          </span>

          <div
            style={{ position: 'relative', flexShrink: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onMenuToggle}
              aria-label="Меню"
              style={{
                width: 26, height: 26, borderRadius: 7, border: 'none',
                cursor: 'pointer',
                background: isMenuOpen ? 'var(--border2)' : 'transparent',
                color: 'var(--ghost)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
                marginLeft: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isMenuOpen ? 'var(--border2)' : 'transparent';
                e.currentTarget.style.color = 'var(--ghost)';
              }}
            >
              <IconDots />
            </button>
            {isMenuOpen && (
              <WorkoutMenu
                style={{ top: 32, right: 0 }}
                onEdit={onEdit}
                onRepeat={onRepeat}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* NAME */}
      <div style={{
        fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
        color: 'var(--text)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.25,
      }}>
        {workout.name}
      </div>

      {/* BOTTOM: chips + arrow (same row, no separator) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, minWidth: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
          minWidth: 0, flex: 1,
        }}>
          {exCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--ghost)',
              fontSize: 11.5, fontWeight: 500,
              padding: '4px 9px', borderRadius: 8,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                color: 'var(--text)', fontWeight: 600, marginRight: 3,
              }}>
                {exCount}
              </span>
              упражн.
            </span>
          )}
          {workout.notes && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--ghost)',
              fontSize: 11.5, fontWeight: 500,
              padding: '4px 9px', borderRadius: 8,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {workout.notes.length > 32 ? workout.notes.slice(0, 32) + '…' : workout.notes}
              </span>
            </span>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onSelect(); }}
          aria-label="Открыть"
          style={{
            width: 30, height: 30, borderRadius: 9, border: 'none',
            cursor: 'pointer',
            background: c.bg, color: c.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, transform .12s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in oklab, ${c.accent} 24%, transparent)`; }}
          onMouseLeave={e => { e.currentTarget.style.background = c.bg; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
        >
          <IconArrow />
        </button>
      </div>
    </div>
  );
};
