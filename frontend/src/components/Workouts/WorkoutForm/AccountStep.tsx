import React from 'react';
import type { WorkoutType } from '../../../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../../../types/workout';

export const TypeIcons: Record<WorkoutType, React.ReactNode> = {
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
