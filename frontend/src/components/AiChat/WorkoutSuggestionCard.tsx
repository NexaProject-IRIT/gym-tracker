import type { WorkoutSuggestion } from '../../hooks/useAiChat';

interface Props {
  suggestion: WorkoutSuggestion;
  onAdd: () => void;
  added: boolean;
  loading: boolean;
}

const TYPE_LABELS: Record<WorkoutSuggestion['type'], string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Гибкость',
  functional: 'Функциональная',
  custom: 'Кастомная',
};

const TYPE_COLORS: Record<WorkoutSuggestion['type'], string> = {
  strength: '#FF6B6B',
  cardio: '#4ECDC4',
  flexibility: '#95E1D3',
  functional: '#FFE66D',
  custom: '#A8E6CF',
};

// Одна строчка упражнения в формате «4 × 8 × 60 кг» / «20 мин» и т.п.
const formatExerciseLine = (ex: WorkoutSuggestion['exercises'][number]): string => {
  const parts: string[] = [];
  if (ex.sets != null) parts.push(`${ex.sets}`);
  if (ex.reps != null) parts.push(`${ex.reps}`);
  if (ex.weight != null) parts.push(`${ex.weight} кг`);
  const base = parts.join(' × ');
  const extras: string[] = [];
  if (ex.time != null) extras.push(`${ex.time} мин`);
  if (ex.distance != null) extras.push(`${ex.distance} км`);
  const extraStr = extras.join(', ');
  if (base && extraStr) return `${base} (${extraStr})`;
  return base || extraStr || '—';
};

export const WorkoutSuggestionCard = ({ suggestion, onAdd, added, loading }: Props) => {
  const typeColor = TYPE_COLORS[suggestion.type] || TYPE_COLORS.custom;
  const typeLabel = TYPE_LABELS[suggestion.type] || 'Тренировка';

  return (
    <div style={{
      marginTop: 12,
      background: '#111318',
      border: '1px solid rgba(110,231,183,0.25)',
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: typeColor,
        }} />
        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>
          {suggestion.name}
        </div>
        <div style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {typeLabel}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginBottom: 14,
      }}>
        {suggestion.exercises.map((ex, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#cbd5e1',
          }}>
            <span style={{ color: '#475569', minWidth: 16 }}>{i + 1}.</span>
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{ex.name}</span>
            <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              {formatExerciseLine(ex)}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={added || loading}
        onClick={onAdd}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          border: 'none',
          cursor: added || loading ? 'default' : 'pointer',
          background: added ? 'rgba(110,231,183,0.15)' : '#6ee7b7',
          color: added ? '#6ee7b7' : '#0f1419',
          fontWeight: 600,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.15s',
        }}
      >
        {added ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Тренировка добавлена
          </>
        ) : loading ? (
          'Добавляю…'
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#0f1419" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            Добавить тренировку
          </>
        )}
      </button>
    </div>
  );
};