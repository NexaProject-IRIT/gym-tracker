import type { Exercise } from '../../types/workout';

interface Props {
  exercise: Exercise;
  onClick: (ex: Exercise) => void;
}

const DIFFICULTY_DOT: Record<string, string> = {
  beginner: '#6ee7b7',
  intermediate: '#fbbf24',
  advanced: '#f87171',
};

const IconDumbbell = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ghost)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16M18 4v16M6 8H2v8h4M18 8h4v8h-4M6 8h12v8H6z"/>
  </svg>
);

export const ExerciseCard = ({ exercise, onClick }: Props) => {
  const dotColor = exercise.difficulty ? (DIFFICULTY_DOT[exercise.difficulty] ?? null) : null;

  return (
    <div
      onClick={() => onClick(exercise)}
      style={{
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-a20)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
      }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '1 / 1', width: '100%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {exercise.images?.cover ? (
          <img
            src={exercise.images.cover}
            alt={exercise.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <IconDumbbell />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {exercise.name}
        </div>

        {exercise.equipment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            {dotColor && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 11, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {exercise.equipment}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
