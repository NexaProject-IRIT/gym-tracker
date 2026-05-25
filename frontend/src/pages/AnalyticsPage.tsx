import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { WorkoutType } from '../types/workout';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPE_COLORS } from '../types/workout';

// ─── Типы ответа бэкенда ──────────────────────────────────────────────────

interface AnalyticsSeries {
  date: string;
  value: number;
  name: string;
}

interface TopExercise {
  name: string;
  count: number;
  max_weight: number | null;
  type_hint: WorkoutType;
}

interface AnalyticsResponse {
  period_days: number;
  dominant_type: WorkoutType | null;
  summary: {
    total_workouts: number;
    active_days: number;
    unique_exercises: number;
    weekly_streak: number;
    total_tonnage: number;
    total_distance: number;
    total_time: number;
  };
  by_type: Partial<Record<WorkoutType, number>>;
  tonnage_series: AnalyticsSeries[];
  distance_series: AnalyticsSeries[];
  time_series: AnalyticsSeries[];
  top_exercises: TopExercise[];
  exercise_names: string[];
}

interface ProgressPoint {
  date: string;
  weight: number;
  sets: number;
  reps: number;
  name: string;
}

// ─── Константы и хелперы ─────────────────────────────────────────────────

const PERIODS: { value: number; label: string; short: string }[] = [
  { value: 7,  label: '7 дней',   short: '7д'  },
  { value: 30, label: '30 дней',  short: '30д' },
  { value: 90, label: '90 дней',  short: '90д' },
  { value: 0,  label: 'Всё время', short: 'Всё' },
];

const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const formatNumber = (n: number, frac = 0): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return frac > 0 ? n.toFixed(frac) : Math.round(n).toString();
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} с`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
};

const formatShortDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
};

const pluralizeWorkouts = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'тренировок';
  if (mod10 === 1) return 'тренировка';
  if (mod10 >= 2 && mod10 <= 4) return 'тренировки';
  return 'тренировок';
};

// ─── SVG-иконки ──────────────────────────────────────────────────────────

const IconChart = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
);
const IconActivity = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconCalendar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconLayers = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l10 5-10 5L2 7l10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const IconFlame = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-2 1-3 .5 1 1.5 1 2 0 0-2-1-3-1-5 1 0 2 0 2 0z" />
    <path d="M9 14a5 5 0 1 0 6 0c-.2 1.5-1.4 2.5-3 2.5s-2.8-1-3-2.5z" />
  </svg>
);
const IconWeight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2" />
  </svg>
);
const IconHeart = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 12h3l2-5 4 10 2-5h6" />
  </svg>
);
const IconClock = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const IconRoute = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19H14a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h5.5" />
  </svg>
);
const IconLeaf = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 16-9 0 6-3 16-9 16-3 0-5-2-5-5 0-5 6-7 11-7" />
  </svg>
);
const IconBolt = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
);
const IconAsterisk = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v16M5 8l14 8M5 16l14-8" />
  </svg>
);
const IconChevron = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const IconTrendUp = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l6-6 4 4 8-8M14 7h7v7" />
  </svg>
);
const IconTrendDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7l6 6 4-4 8 8M14 17h7v-7" />
  </svg>
);
const IconEmpty = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 13h6M9 17h3" opacity="0.4" />
  </svg>
);

const typeIcon = (type: WorkoutType, size = 14) => {
  switch (type) {
    case 'strength':    return <IconWeight size={size} />;
    case 'cardio':      return <IconHeart size={size} />;
    case 'flexibility': return <IconLeaf size={size} />;
    case 'functional':  return <IconBolt size={size} />;
    default:            return <IconAsterisk size={size} />;
  }
};

// ─── Линейный график SVG ─────────────────────────────────────────────────

interface LineChartProps {
  data: { date: string; value: number; label?: string }[];
  yLabel: string;
  color: string;
  formatY?: (v: number) => string;
  height?: number;
}

const LineChart = ({ data, yLabel, color, formatY = (v) => formatNumber(v, 1), height = 220 }: LineChartProps) => {
  const padding = { top: 16, right: 16, bottom: 32, left: 44 };
  const width = 600;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return null;
  }

  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = Math.max(maxV - minV, maxV * 0.1, 1);
  const yMin = Math.max(0, minV - range * 0.15);
  const yMax = maxV + range * 0.15;
  const ySpan = yMax - yMin || 1;

  const xAt = (i: number) => data.length === 1
    ? padding.left + innerW / 2
    : padding.left + (i / (data.length - 1)) * innerW;
  const yAt = (v: number) => padding.top + (1 - (v - yMin) / ySpan) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${xAt(data.length - 1)} ${padding.top + innerH} L ${xAt(0)} ${padding.top + innerH} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (ySpan * i) / ticks);

  const trend = data.length >= 2 ? data[data.length - 1].value - data[0].value : 0;
  const trendPct = data[0].value > 0 ? (trend / data[0].value) * 100 : 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Заголовок-метрики */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="num-mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>
          {formatY(data[data.length - 1].value)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ghost)' }}>последнее значение</div>
        {data.length >= 2 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 999,
            background: trend >= 0 ? 'rgba(110,231,183,0.12)' : 'rgba(239,68,68,0.12)',
            color: trend >= 0 ? 'var(--accent)' : '#ef4444',
            fontSize: 11.5, fontWeight: 600,
            marginLeft: 'auto',
          }}>
            {trend >= 0 ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
            {trend >= 0 ? '+' : ''}{formatY(Math.abs(trend))}
            {data[0].value > 0 && <span style={{ opacity: 0.7 }}>({trendPct >= 0 ? '+' : ''}{trendPct.toFixed(0)}%)</span>}
          </div>
        )}
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 320, height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-сетка */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={padding.left} x2={width - padding.right}
                y1={yAt(v)} y2={yAt(v)}
                stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'}
              />
              <text
                x={padding.left - 8} y={yAt(v) + 3}
                fontSize="10" fill="var(--ghost)" textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
              >
                {formatY(v)}
              </text>
            </g>
          ))}

          {/* Y-метка */}
          <text
            x={padding.left} y={padding.top - 4}
            fontSize="9" fill="var(--ghost)" textAnchor="start"
            letterSpacing="0.05em"
          >
            {yLabel.toUpperCase()}
          </text>

          {/* Заливка под линией */}
          <path d={areaPath} fill="url(#lc-area)" />

          {/* Линия */}
          <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Точки */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={xAt(i)} cy={yAt(d.value)} r="6" fill={color} opacity="0.15" />
              <circle cx={xAt(i)} cy={yAt(d.value)} r="3.2" fill="var(--bg)" stroke={color} strokeWidth="2" />
            </g>
          ))}

          {/* X-метки (не все, чтоб не наслаивались) */}
          {data.map((d, i) => {
            const showEvery = Math.max(1, Math.ceil(data.length / 6));
            if (i % showEvery !== 0 && i !== data.length - 1) return null;
            return (
              <text
                key={i}
                x={xAt(i)} y={height - padding.bottom + 16}
                fontSize="10" fill="var(--ghost)" textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
              >
                {formatShortDate(d.date)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ─── Donut-диаграмма по типам тренировок ─────────────────────────────────

interface DonutProps {
  segments: { type: WorkoutType; count: number; color: string }[];
}

const Donut = ({ segments }: DonutProps) => {
  const total = segments.reduce((a, s) => a + s.count, 0);
  const r = 56;
  const cx = 70;
  const cy = 70;
  const C = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" width="140" height="140" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="14" />
      {total > 0 && segments.map((s, i) => {
        const len = (s.count / total) * C;
        const dash = `${len} ${C - len}`;
        const node = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += len;
        return node;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)" fontFamily="JetBrains Mono, ui-monospace, monospace">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="var(--ghost)" letterSpacing="0.08em">
        {pluralizeWorkouts(total).toUpperCase()}
      </text>
    </svg>
  );
};

// ─── Горизонтальный bar для tonnage/distance ─────────────────────────────

interface MiniBarProps {
  data: AnalyticsSeries[];
  color: string;
  formatValue: (v: number) => string;
}

const MiniBars = ({ data, color, formatValue }: MiniBarProps) => {
  const items = data.slice(-10);
  const max = Math.max(...items.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56, minWidth: 56,
              fontSize: 11, color: 'var(--ghost)',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            }}>
              {formatShortDate(d.date)}
            </div>
            <div style={{
              flex: 1, height: 8, borderRadius: 999,
              background: 'var(--border)', overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${Math.max(pct, 2)}%`, height: '100%',
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                borderRadius: 999,
                transition: 'width 400ms ease',
              }} />
            </div>
            <div className="num-mono" style={{
              width: 72, textAlign: 'right',
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
            }}>
              {formatValue(d.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Главный компонент ──────────────────────────────────────────────────

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState<number>(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    apiFetch<AnalyticsResponse>(`/workouts/analytics/?period=${period}`)
      .then(d => {
        setData(d);
        // Выбираем упражнение по умолчанию: первое из top_exercises с max_weight, или первое из exercise_names
        const firstWithWeight = d.top_exercises.find(e => e.max_weight != null);
        const defaultEx = firstWithWeight?.name || d.exercise_names[0] || '';
        setSelectedExercise(prev => prev && d.exercise_names.includes(prev) ? prev : defaultEx);
      })
      .catch(() => setError('Не удалось загрузить аналитику'))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedExercise) { setProgress([]); return; }
    apiFetch<ProgressPoint[]>(`/workouts/exercise-progress/?name=${encodeURIComponent(selectedExercise)}`)
      .then(setProgress)
      .catch(() => setProgress([]));
  }, [selectedExercise]);

  const summary = data?.summary;
  const dominant = data?.dominant_type;

  // ── Адаптивные KPI ──
  // 4 универсальных карточки + одна "главная" заменяется на тип-специфичную метрику
  const kpis = useMemo(() => {
    if (!summary) return [];

    const universal = [
      {
        icon: <IconActivity size={14} />,
        label: 'Тренировок',
        value: summary.total_workouts.toString(),
        sub: pluralizeWorkouts(summary.total_workouts),
        color: 'var(--accent)',
      },
      {
        icon: <IconCalendar size={14} />,
        label: 'Активных дней',
        value: summary.active_days.toString(),
        sub: 'в выбранный период',
        color: '#3b82f6',
      },
      {
        icon: <IconLayers size={14} />,
        label: 'Упражнений',
        value: summary.unique_exercises.toString(),
        sub: 'уникальных',
        color: '#a855f7',
      },
      {
        icon: <IconFlame size={14} />,
        label: 'Стрик',
        value: summary.weekly_streak.toString(),
        sub: 'недель подряд',
        color: '#fb923c',
      },
    ];

    // Тип-специфичный KPI (заменяет один из универсальных если есть данные)
    if (dominant === 'strength' && summary.total_tonnage > 0) {
      universal[1] = {
        icon: <IconWeight size={14} />,
        label: 'Тоннаж',
        value: formatNumber(summary.total_tonnage),
        sub: 'кг суммарно',
        color: WORKOUT_TYPE_COLORS.strength.accent,
      };
    } else if (dominant === 'cardio' && summary.total_distance > 0) {
      universal[1] = {
        icon: <IconRoute size={14} />,
        label: 'Дистанция',
        value: summary.total_distance.toFixed(1),
        sub: 'км суммарно',
        color: WORKOUT_TYPE_COLORS.cardio.accent,
      };
    } else if ((dominant === 'flexibility' || dominant === 'functional') && summary.total_time > 0) {
      universal[1] = {
        icon: <IconClock size={14} />,
        label: 'Время',
        value: formatTime(summary.total_time),
        sub: 'практики',
        color: WORKOUT_TYPE_COLORS[dominant].accent,
      };
    }

    return universal;
  }, [summary, dominant]);

  const typeSegments = useMemo(() => {
    if (!data) return [];
    return (Object.keys(data.by_type) as WorkoutType[])
      .filter(t => (data.by_type[t] ?? 0) > 0)
      .map(t => ({
        type: t,
        count: data.by_type[t] ?? 0,
        color: WORKOUT_TYPE_COLORS[t].accent,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const totalWorkouts = summary?.total_workouts ?? 0;
  const maxExerciseCount = useMemo(
    () => Math.max(1, ...(data?.top_exercises.map(e => e.count) ?? [])),
    [data]
  );

  // ── Render ──

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: isMobile ? '20px 16px 24px' : '28px 32px 40px',
    }}>
      <style>{`
        @keyframes an-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .an-fade { animation: an-fade 400ms ease both; }
        .an-card-press { transition: transform 120ms ease, background 120ms ease; }
        .an-card-press:active { transform: scale(0.98); }
        .an-period-btn { transition: all 150ms ease; }
        .an-dropdown::-webkit-scrollbar { width: 6px; }
        .an-dropdown::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 999px; }
      `}</style>

      {/* ── Шапка ── */}
      <header className="an-fade" style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--ghost)', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}><IconChart size={14} /></span>
          Аналитика
        </div>
        <h1 style={{
          margin: 0, fontSize: isMobile ? 26 : 32, fontWeight: 700,
          letterSpacing: '-0.02em', color: 'var(--text)',
        }}>
          Твой прогресс
        </h1>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          {dominant ? (
            <>Основной тип: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{WORKOUT_TYPE_LABELS[dominant].toLowerCase()}</span></>
          ) : (
            'Начни тренироваться, чтобы увидеть статистику'
          )}
        </div>
      </header>

      {/* ── Селектор периода ── */}
      <div
        className="an-fade"
        style={{
          display: 'flex', gap: 6, marginBottom: 28,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 4,
          width: 'fit-content',
          animationDelay: '60ms',
        }}
      >
        {PERIODS.map(p => (
          <button
            key={p.value}
            className="an-period-btn"
            onClick={() => setPeriod(p.value)}
            style={{
              padding: isMobile ? '7px 12px' : '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: period === p.value ? 'var(--accent-a12)' : 'transparent',
              color: period === p.value ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, fontWeight: period === p.value ? 600 : 500,
              cursor: 'pointer',
              letterSpacing: '-0.005em',
            }}
          >
            {isMobile ? p.short : p.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          color: '#fca5a5', fontSize: 13, marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* ── KPI grid ── */}
      <div
        className="an-fade"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 32,
          animationDelay: '120ms',
        }}
      >
        {kpis.map((k, i) => (
          <div
            key={i}
            className="an-card-press"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: isMobile ? '14px 14px' : '18px 18px',
              display: 'flex', flexDirection: 'column', gap: 6,
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: 12, right: 12,
              width: 28, height: 28, borderRadius: 8,
              background: `color-mix(in srgb, ${k.color} 14%, transparent)`,
              color: k.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {k.icon}
            </div>
            <div style={{
              fontSize: 10.5, color: 'var(--ghost)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              {k.label}
            </div>
            <div className="num-mono" style={{
              fontSize: isMobile ? 22 : 26, fontWeight: 700,
              color: 'var(--text)', lineHeight: 1, marginTop: 2,
              letterSpacing: '-0.02em',
            }}>
              {loading ? '—' : k.value}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--dim)', marginTop: 1 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Пусто? ── */}
      {!loading && totalWorkouts === 0 && (
        <div className="an-fade" style={{
          padding: '64px 24px', textAlign: 'center',
          color: 'var(--ghost)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
        }}>
          <div style={{ color: 'var(--dim)', display: 'inline-flex' }}>
            <IconEmpty size={36} />
          </div>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 10, fontWeight: 500 }}>
            За этот период нет тренировок
          </div>
          <div style={{ fontSize: 13, color: 'var(--ghost)', marginTop: 4 }}>
            Выбери другой период или добавь тренировку
          </div>
        </div>
      )}

      {totalWorkouts > 0 && (
        <>
          {/* ── Donut + Top exercises (две колонки) ── */}
          <div
            className="an-fade"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 360px) 1fr',
              gap: 16,
              marginBottom: 32,
              animationDelay: '180ms',
            }}
          >
            {/* Distribution */}
            <section style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 20,
            }}>
              <h2 style={sectionTitleStyle}>Распределение типов</h2>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                <Donut segments={typeSegments} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 140 }}>
                  {typeSegments.map(s => {
                    const pct = totalWorkouts > 0 ? (s.count / totalWorkouts) * 100 : 0;
                    return (
                      <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: `color-mix(in srgb, ${s.color} 18%, transparent)`,
                          color: s.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {typeIcon(s.type, 12)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>
                            {WORKOUT_TYPE_LABELS[s.type]}
                          </div>
                          <div className="num-mono" style={{ fontSize: 10.5, color: 'var(--ghost)' }}>
                            {s.count} · {pct.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Top exercises */}
            <section style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 20,
            }}>
              <h2 style={sectionTitleStyle}>Топ упражнений</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                {data?.top_exercises.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--ghost)', padding: '12px 0' }}>
                    Нет данных
                  </div>
                )}
                {data?.top_exercises.map((ex) => {
                  const pct = (ex.count / maxExerciseCount) * 100;
                  const color = WORKOUT_TYPE_COLORS[ex.type_hint].accent;
                  return (
                    <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: `color-mix(in srgb, ${color} 16%, transparent)`,
                        color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {typeIcon(ex.type_hint, 13)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, color: 'var(--text)', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {ex.name}
                        </div>
                        <div style={{
                          width: '100%', height: 6, borderRadius: 999,
                          background: 'var(--border)', marginTop: 6, overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${pct}%`, height: '100%',
                            background: color, borderRadius: 999,
                            transition: 'width 400ms ease',
                          }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="num-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                          {ex.count}×
                        </div>
                        {ex.max_weight != null && (
                          <div className="num-mono" style={{ fontSize: 10.5, color: 'var(--ghost)' }}>
                            max {ex.max_weight} кг
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Прогресс упражнения ── */}
          {data && data.exercise_names.length > 0 && (
            <section
              className="an-fade"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 32,
                animationDelay: '240ms',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, marginBottom: 4, flexWrap: 'wrap',
              }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Прогресс упражнения</h2>

                {/* Custom dropdown */}
                <div style={{ position: 'relative', minWidth: 220 }}>
                  <button
                    onClick={() => setDropdownOpen(o => !o)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--bg)',
                      border: '1px solid var(--border2)',
                      color: 'var(--text)',
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, textAlign: 'left',
                    }}>
                      {selectedExercise || 'Выберите упражнение'}
                    </span>
                    <span style={{
                      color: 'var(--ghost)',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 150ms ease',
                      display: 'flex',
                    }}>
                      <IconChevron size={14} />
                    </span>
                  </button>
                  {dropdownOpen && (
                    <div
                      className="an-dropdown"
                      style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'var(--surface)',
                        border: '1px solid var(--border2)',
                        borderRadius: 10, padding: 4,
                        maxHeight: 240, overflowY: 'auto',
                        zIndex: 50,
                        boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                      }}
                    >
                      {data.exercise_names.map(name => (
                        <button
                          key={name}
                          onClick={() => { setSelectedExercise(name); setDropdownOpen(false); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '7px 10px', borderRadius: 6,
                            background: name === selectedExercise ? 'var(--accent-a12)' : 'transparent',
                            color: name === selectedExercise ? 'var(--accent)' : 'var(--text)',
                            border: 'none', cursor: 'pointer',
                            fontSize: 12.5,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {progress.length === 0 ? (
                <div style={{
                  padding: '36px 24px', textAlign: 'center',
                  color: 'var(--ghost)', fontSize: 13,
                }}>
                  {selectedExercise
                    ? 'Нет записей с весом для этого упражнения'
                    : 'Выбери упражнение, чтобы увидеть прогресс'}
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <LineChart
                    data={progress.map(p => ({ date: p.date, value: p.weight }))}
                    yLabel="вес, кг"
                    color="var(--accent)"
                    formatY={(v) => `${v.toFixed(v >= 100 ? 0 : 1)}`}
                    height={isMobile ? 200 : 240}
                  />
                </div>
              )}
            </section>
          )}

          {/* ── Тоннаж (только если есть силовые) ── */}
          {data && data.tonnage_series.length > 0 && (
            <section
              className="an-fade"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                animationDelay: '300ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Тоннаж по тренировкам</h2>
                <div style={{
                  fontSize: 11.5, color: 'var(--ghost)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <IconWeight size={12} />
                  последние {Math.min(10, data.tonnage_series.length)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <MiniBars
                  data={data.tonnage_series}
                  color={WORKOUT_TYPE_COLORS.strength.accent}
                  formatValue={(v) => `${formatNumber(v)} кг`}
                />
              </div>
            </section>
          )}

          {/* ── Дистанция (только если есть кардио) ── */}
          {data && data.distance_series.length > 0 && (
            <section
              className="an-fade"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                animationDelay: '320ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Дистанция по тренировкам</h2>
                <div style={{ fontSize: 11.5, color: 'var(--ghost)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconRoute size={12} />
                  последние {Math.min(10, data.distance_series.length)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <MiniBars
                  data={data.distance_series}
                  color={WORKOUT_TYPE_COLORS.cardio.accent}
                  formatValue={(v) => `${v.toFixed(2)} км`}
                />
              </div>
            </section>
          )}

          {/* ── Время практики (для гибкости/функционалки) ── */}
          {data && data.time_series.length > 0 && (
            <section
              className="an-fade"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                animationDelay: '340ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Время практики</h2>
                <div style={{ fontSize: 11.5, color: 'var(--ghost)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconClock size={12} />
                  последние {Math.min(10, data.time_series.length)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <MiniBars
                  data={data.time_series}
                  color={WORKOUT_TYPE_COLORS.flexibility.accent}
                  formatValue={formatTime}
                />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ─── Общий стиль для заголовков секций ───────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 4,
};
