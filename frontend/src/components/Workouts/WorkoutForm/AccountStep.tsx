import React from 'react';
import type { WorkoutType } from '../../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../../types/workout';
import { WORKOUT_TYPE_ICON_PATHS } from '../../../constants/workoutTypes';

export const TypeIcons: Record<WorkoutType, React.ReactNode> = Object.fromEntries(
  (Object.keys(WORKOUT_TYPE_ICON_PATHS) as WorkoutType[]).map(type => [
    type,
    <svg key={type} width="20" height="20" viewBox="0 0 24 24" fill="none">
      {WORKOUT_TYPE_ICON_PATHS[type].map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      ))}
    </svg>,
  ])
) as Record<WorkoutType, React.ReactNode>;

const TYPE_DESCRIPTIONS: Record<WorkoutType, string> = {
  strength: 'Базовые упражнения, железо, прогрессивная перегрузка',
  cardio: 'Бег, велосипед, эллипс, плавание',
  flexibility: 'Йога, стретчинг, мобильность',
  functional: 'Кроссфит, интервалы, функциональный тренинг',
  custom: 'Своя программа — любые параметры',
};

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Props {
  onSelect: (type: WorkoutType) => void;
}

export const AccountStep: React.FC<Props> = ({ onSelect }) => (
  <>
    <p style={{ color: 'var(--dim)', fontSize: 14, margin: '0 0 20px' }}>Выберите тип тренировки</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {(Object.keys(TypeIcons) as WorkoutType[]).map(type => {
        const col = WORKOUT_TYPE_COLORS[type];
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
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
);
