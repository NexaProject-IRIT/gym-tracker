import type { WorkoutRenameEntry } from '../../hooks/useAiChat';

interface Props {
  renames: WorkoutRenameEntry[];
  onApply: () => void;
  applied: boolean;
  loading: boolean;
}

function pluralWorkouts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} тренировку`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} тренировки`;
  return `${n} тренировок`;
}

export const WorkoutRenameCard = ({ renames, onApply, applied, loading }: Props) => {
  const total = renames.length;

  return (
    <div style={{
      marginTop: 12,
      border: '1px solid var(--accent-a20)',
      borderRadius: 12,
      background: 'var(--accent-a10)',
      overflow: 'hidden',
    }}>
      {/* Заголовок */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--accent)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Новые названия — {pluralWorkouts(total)}
        </span>
      </div>

      {/* Список переименований */}
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
        {renames.map((r, i) => (
          <div key={r.id} style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: i < renames.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--accent)' }}>
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{
              color: 'var(--text2)', fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {r.new_name}
            </span>
          </div>
        ))}
      </div>

      {/* Кнопка */}
      <div style={{ padding: '10px 14px' }}>
        {applied ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Тренировки переименованы
          </div>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px 16px',
              borderRadius: 9,
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              background: loading ? 'var(--accent-a30)' : 'var(--accent)',
              color: 'var(--accent-fg)',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              'Применяю…'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Применить переименование
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
