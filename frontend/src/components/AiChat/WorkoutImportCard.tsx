import type { WorkoutImportEntry } from '../../hooks/useAiChat';

interface Props {
  imports: WorkoutImportEntry[];
  onImport: () => void;
  imported: boolean;
  loading: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  strength:    'Силовая',
  cardio:      'Кардио',
  flexibility: 'Гибкость',
  functional:  'Функциональная',
  custom:      'Кастомная',
};

const TYPE_COLORS: Record<string, string> = {
  strength:    '#FF6B6B',
  cardio:      '#4ECDC4',
  flexibility: '#95E1D3',
  functional:  '#FFE66D',
  custom:      '#A8E6CF',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function pluralWorkouts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return `${n} тренировку`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} тренировки`;
  return `${n} тренировок`;
}

export const WorkoutImportCard = ({ imports, onImport, imported, loading }: Props) => {
  const total = imports.length;

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
          <path d="M12 2v10m0 0l-3-3m3 3l3-3M3 17l1.5 3h15L21 17"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Импорт из дневника — {pluralWorkouts(total)}
        </span>
      </div>

      {/* Список тренировок */}
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
        {imports.map((w, i) => (
          <div key={i} style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            borderBottom: i < imports.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            {/* Цветная точка типа */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              background: TYPE_COLORS[w.type] ?? TYPE_COLORS.custom,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: 'var(--text2)', fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {w.name}
              </div>
              <div style={{ color: 'var(--dim)', fontSize: 11, marginTop: 2 }}>
                {formatDate(w.date)}
                {' · '}
                {TYPE_LABELS[w.type] ?? 'Кастомная'}
                {' · '}
                {w.exercises.length} упр.
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка */}
      <div style={{ padding: '10px 14px' }}>
        {imported ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Тренировки добавлены в журнал
          </div>
        ) : (
          <button
            type="button"
            onClick={onImport}
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
              'Добавляю…'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
                Добавить {pluralWorkouts(total)} в журнал
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
