import { useEffect, useMemo, useRef, useState } from 'react';
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
const IconInfo = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M12 12v4" />
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

// Алгоритм "круглых" чисел для оси Y (на основе D3 d3-array nice/ticks):
// возвращает шаг и границы, в которых все деления попадают на круглые значения.
const niceNum = (range: number, round: boolean): number => {
  if (range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let nice: number;
  if (round) {
    if (fraction < 1.5) nice = 1;
    else if (fraction < 3) nice = 2;
    else if (fraction < 7) nice = 5;
    else nice = 10;
  } else {
    if (fraction <= 1) nice = 1;
    else if (fraction <= 2) nice = 2;
    else if (fraction <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exponent);
};

const niceScale = (min: number, max: number, ticks = 4) => {
  if (!isFinite(min) || !isFinite(max)) return { tickValues: [0, 1], yMin: 0, yMax: 1 };
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    min -= pad; max += pad;
  }
  const niceRange = niceNum(max - min, false);
  const step = niceNum(niceRange / Math.max(1, ticks), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const tickValues: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 1e-6; v += step) {
    tickValues.push(Number(v.toFixed(10)));
  }
  return { tickValues, yMin: niceMin, yMax: niceMax };
};

// Кубический ease для tween Y-шкалы.
const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type ScaleState = { yMin: number; yMax: number; tickValues: number[] };

// Кривая перехода между состояниями графика — едина для всех CSS-трансишенов.
// Быстрый settle, чтобы при частой навигации точки успевали доехать до места.
const FLOW_EASE = 'cubic-bezier(0.25, 0.8, 0.3, 1)';
const FLOW_MS = 240;

const LineChart = ({ data, yLabel, color, formatY = (v) => formatNumber(v, 1), height = 240 }: LineChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [pageEnd, setPageEnd] = useState(data.length);
  const [viewMode, setViewMode] = useState<'window' | 'all'>('window');
  const uid = useRef(Math.random().toString(36).slice(2, 8));

  // Измеряем ширину контейнера, чтоб шрифт и линии рендерились в реальных пикселях.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    setWidth(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Сколько точек умещается, чтоб подписи дат не слипались.
  const pointsPerPage = useMemo(() => {
    if (width < 360) return 5;
    if (width < 480) return 6;
    if (width < 640) return 8;
    return 10;
  }, [width]);

  // По умолчанию показываем самые свежие точки.
  useEffect(() => {
    setPageEnd(data.length);
  }, [data.length]);

  // Если изменилось число точек на странице — нормализуем правую границу.
  useEffect(() => {
    setPageEnd(prev => Math.min(Math.max(pointsPerPage, prev), data.length));
  }, [pointsPerPage, data.length]);

  const safePageEnd = Math.min(Math.max(pointsPerPage, pageEnd), data.length);
  const pageStart = Math.max(0, safePageEnd - pointsPerPage);
  const visible = data.slice(pageStart, safePageEnd);

  const canGoBack = viewMode === 'window' && pageStart > 0;
  const canGoForward = viewMode === 'window' && safePageEnd < data.length;
  const stepBy = Math.max(1, Math.floor(pointsPerPage / 2));
  const goBack = () => setPageEnd(p => Math.max(pointsPerPage, p - stepBy));
  const goForward = () => setPageEnd(p => Math.min(data.length, p + stepBy));

  const padding = { top: 22, right: 16, bottom: 38, left: 52 };
  const innerW = Math.max(40, width - padding.left - padding.right);
  const innerH = Math.max(40, height - padding.top - padding.bottom);

  // ── Целевая Y-шкала по «эффективным» данным (окно или вся история).
  const effective = viewMode === 'all' ? data : visible;
  const targetScale: ScaleState = useMemo(() => {
    if (!effective.length) return { yMin: 0, yMax: 1, tickValues: [0, 1] };
    const values = effective.map(d => d.value);
    return niceScale(Math.min(...values), Math.max(...values), 4);
  }, [effective]);

  // ── Анимация Y-шкалы: rAF-tween от старых значений к новым.
  // Каждый кадр пересчитываем «круглые» деления — числа на оси плавно перетекают
  // через промежуточные nice-значения, а не моргают между конечными состояниями.
  const [animScale, setAnimScale] = useState<ScaleState>(targetScale);
  const animRef = useRef<ScaleState>(animScale);
  const rafRef = useRef<number | null>(null);

  // ВАЖНО: зависим от примитивных yMin/yMax, а не от объекта targetScale.
  // Иначе на каждом ререндере (data — новый массив сверху, useMemo пересчитывает
  // и возвращает новый объект) эффект бы рефайрился, перезапускал rAF и вызывал
  // setAnimScale → новый ререндер → бесконечный цикл, который замораживает страницу.
  const targetYMin = targetScale.yMin;
  const targetYMax = targetScale.yMax;
  useEffect(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const from = animRef.current;
    const toYMin = targetYMin;
    const toYMax = targetYMax;
    // Если разница ничтожна — ничего не делаем, чтобы не плодить лишние ререндеры.
    if (Math.abs(from.yMin - toYMin) < 1e-6 && Math.abs(from.yMax - toYMax) < 1e-6) {
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FLOW_MS);
      const e = easeInOutCubic(t);
      const yMin = from.yMin + (toYMin - from.yMin) * e;
      const yMax = from.yMax + (toYMax - from.yMax) * e;
      const tickValues = niceScale(yMin, yMax, 4).tickValues;
      const next: ScaleState = { yMin, yMax, tickValues };
      animRef.current = next;
      setAnimScale(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetYMin, targetYMax]);

  if (data.length === 0) return null;

  const ySpan = (animScale.yMax - animScale.yMin) || 1;
  const yAt = (v: number) => padding.top + (1 - (v - animScale.yMin) / ySpan) * innerH;

  // ── Позиции для ВСЕХ точек: вне окна — «склеены» в первой/последней видимой
  // точке (нулевая длина сегмента), снаружи клипа. Path всегда имеет одно и то же
  // число команд, поэтому браузер плавно интерполирует `d` при смене состояния.
  const firstVisible = visible[0];
  const lastVisible = visible[visible.length - 1];
  const positions = data.map((d, i) => {
    if (viewMode === 'all') {
      const x = data.length === 1
        ? padding.left + innerW / 2
        : padding.left + (i / (data.length - 1)) * innerW;
      return { x, y: yAt(d.value), inWindow: true };
    }
    if (i < pageStart) {
      return {
        x: padding.left,
        y: firstVisible ? yAt(firstVisible.value) : padding.top + innerH,
        inWindow: false,
      };
    }
    if (i >= safePageEnd) {
      return {
        x: padding.left + innerW,
        y: lastVisible ? yAt(lastVisible.value) : padding.top + innerH,
        inWindow: false,
      };
    }
    const winLen = visible.length;
    const x = winLen === 1
      ? padding.left + innerW / 2
      : padding.left + ((i - pageStart) / (winLen - 1)) * innerW;
    return { x, y: yAt(d.value), inWindow: true };
  });

  const linePath = positions
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = positions.length >= 2
    ? `${linePath} L ${positions[positions.length - 1].x.toFixed(2)} ${(padding.top + innerH).toFixed(2)} L ${positions[0].x.toFixed(2)} ${(padding.top + innerH).toFixed(2)} Z`
    : '';

  // В режиме «всё время» подписи дат не лезут друг на друга:
  // показываем равномерное подмножество + всегда последнюю.
  const xLabelEvery = viewMode === 'all'
    ? Math.max(1, Math.ceil(data.length / Math.max(4, pointsPerPage)))
    : 1;

  // Тренд по всей истории, не по окну — пользователь видит общую картину.
  const trend = data.length >= 2 ? data[data.length - 1].value - data[0].value : 0;
  const trendPct = data[0].value > 0 ? (trend / data[0].value) * 100 : 0;

  const clipId = `lc-clip-${uid.current}`;
  const gradId = `lc-area-${uid.current}`;
  const flowTransition = (props: string) =>
    props.split(',').map(p => `${p.trim()} ${FLOW_MS}ms ${FLOW_EASE}`).join(', ');

  return (
    <div style={{ width: '100%' }}>
      {/* Заголовок-метрики + переключатель режима */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 1, minWidth: 0 }}>
          <div className="num-mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>
            {formatY(data[data.length - 1].value)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ghost)' }}>последнее значение</div>
        </div>
        {data.length >= 2 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 999,
            background: trend >= 0 ? 'rgba(110,231,183,0.12)' : 'rgba(239,68,68,0.12)',
            color: trend >= 0 ? 'var(--accent)' : '#ef4444',
            fontSize: 11.5, fontWeight: 600,
          }}>
            {trend >= 0 ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
            {trend >= 0 ? '+' : ''}{formatY(Math.abs(trend))}
            {data[0].value > 0 && <span style={{ opacity: 0.7 }}>({trendPct >= 0 ? '+' : ''}{trendPct.toFixed(0)}%)</span>}
          </div>
        )}
      </div>

      {/* Сегментированный переключатель «окно» / «всё время» */}
      <div style={{
        display: 'inline-flex', gap: 4,
        background: 'var(--bg)',
        border: '1px solid var(--border2)',
        borderRadius: 10, padding: 3,
        marginBottom: 14,
      }}>
        {([
          { key: 'window', label: 'Окно' },
          { key: 'all',    label: 'Всё время' },
        ] as const).map(opt => {
          const active = viewMode === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setViewMode(opt.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                background: active ? 'var(--accent-a12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'background 200ms ease, color 200ms ease',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Контейнер фиксированной ширины — никакого горизонтального скролла */}
      <div ref={containerRef} style={{ width: '100%' }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect x={padding.left} y={padding.top - 4} width={innerW} height={innerH + 8} />
            </clipPath>
          </defs>

          {/* Y-сетка: ключи по индексу — существующие деления плавно скользят,
              новые/уходящие появляются/исчезают через opacity. */}
          {animScale.tickValues.map((v, i) => (
            <g key={i} style={{ transition: flowTransition('opacity') }}>
              <line
                x1={padding.left} x2={width - padding.right}
                y1={yAt(v)} y2={yAt(v)}
                stroke="var(--border)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 4'}
                style={{ transition: flowTransition('y1, y2') }}
              />
              <text
                x={padding.left - 8} y={yAt(v) + 4}
                fontSize="11" fill="var(--ghost)" textAnchor="end"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                style={{ transition: flowTransition('y') }}
              >
                {formatY(v)}
              </text>
            </g>
          ))}

          {/* Y-метка */}
          <text
            x={padding.left} y={padding.top - 6}
            fontSize="10" fill="var(--ghost)" textAnchor="start"
            letterSpacing="0.05em"
          >
            {yLabel.toUpperCase()}
          </text>

          {/* Заливка + линия — обёрнуты в clipPath, поэтому склеенные за пределами
              окна команды не вылезают визуально. CSS transition на `d` плавно
              перетекает форму при навигации и при переключении режима. */}
          <g clipPath={`url(#${clipId})`}>
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradId})`}
                style={{ transition: flowTransition('d') }}
              />
            )}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: flowTransition('d') }}
            />
          </g>

          {/* Точки: рендерим ВСЕ. Те, что вне окна — opacity 0, склеены у краёв.
              CSS-transition плавно сдвигает cx/cy и проявляет/прячет opacity. */}
          <g clipPath={`url(#${clipId})`}>
            {data.map((d, i) => {
              const p = positions[i];
              const op = p.inWindow ? 1 : 0;
              const tStyle = { transition: flowTransition('cx, cy, opacity') };
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="6" fill={color} opacity={0.15 * op} style={tStyle} />
                  <circle
                    cx={p.x} cy={p.y} r="3.5"
                    fill="var(--bg)" stroke={color} strokeWidth="2"
                    opacity={op}
                    style={tStyle}
                  />
                </g>
              );
            })}
          </g>

          {/* X-метки: тоже рендерим все. В «окне» — только видимые подписи,
              в «всё время» — каждая N-ая + последняя, чтобы не слипались. */}
          {data.map((d, i) => {
            const p = positions[i];
            let op = p.inWindow ? 1 : 0;
            if (viewMode === 'all' && i % xLabelEvery !== 0 && i !== data.length - 1) {
              op = 0;
            }
            return (
              <text
                key={i}
                x={p.x} y={height - padding.bottom + 18}
                fontSize="11" fill="var(--ghost)" textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                opacity={op}
                style={{ transition: flowTransition('x, opacity') }}
              >
                {formatShortDate(d.date)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Навигация: только в режиме «окно» и только если есть что листать */}
      {viewMode === 'window' && data.length > pointsPerPage && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginTop: 8,
        }}>
          <button
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Назад"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 8,
              background: canGoBack ? 'var(--bg)' : 'transparent',
              border: '1px solid var(--border2)',
              color: canGoBack ? 'var(--text)' : 'var(--dim)',
              fontSize: 12, fontWeight: 500,
              cursor: canGoBack ? 'pointer' : 'default',
              opacity: canGoBack ? 1 : 0.4,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            раньше
          </button>
          <div className="num-mono" style={{ fontSize: 11, color: 'var(--ghost)' }}>
            {pageStart + 1}–{safePageEnd} из {data.length}
          </div>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            aria-label="Вперёд"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 8,
              background: canGoForward ? 'var(--bg)' : 'transparent',
              border: '1px solid var(--border2)',
              color: canGoForward ? 'var(--text)' : 'var(--dim)',
              fontSize: 12, fontWeight: 500,
              cursor: canGoForward ? 'pointer' : 'default',
              opacity: canGoForward ? 1 : 0.4,
            }}
          >
            позже
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
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
  // Сверху самая свежая дата, снизу самая старая.
  const items = data.slice(-10).slice().reverse();
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

// ─── Подсказка (ⓘ) ───────────────────────────────────────────────────────

const HintIcon = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ghost)', display: 'flex', alignItems: 'center',
          padding: '0 2px', lineHeight: 1,
        }}
      >
        <IconInfo size={13} />
      </button>
      {visible && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

// ─── Главный компонент ──────────────────────────────────────────────────

// ─── Скелетон загрузки ──────────────────────────────────────────────────
// Повторяет общую сетку страницы, чтобы при первом запросе аналитики не было
// «прыжка» layout'а и пустых пятен. Используется тот же sk-shimmer, что и на
// ProfilePage / WorkoutDetail / KnowledgeBase.

const AnalyticsSkeleton: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const skBase: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
    backgroundSize: '200% 100%',
    animation: 'sk-shimmer 1.4s ease-in-out infinite',
    borderRadius: 6,
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: isMobile ? 14 : 18,
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: isMobile ? '20px 16px 24px' : '28px 32px 40px',
    }}>
      <style>{`@keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Шапка */}
      <header style={{ marginBottom: 24 }}>
        <div style={{ ...skBase, width: 110, height: 12, marginBottom: 10 }} />
        <div style={{ ...skBase, width: '52%', height: isMobile ? 30 : 36, marginBottom: 10 }} />
        <div style={{ ...skBase, width: '34%', height: 14 }} />
      </header>

      {/* Селектор периода */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 28,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: 4,
        width: 'fit-content',
      }}>
        {[44, 56, 56, 64].map((w, i) => (
          <div key={i} style={{
            ...skBase,
            width: isMobile ? Math.round(w * 0.72) : w,
            height: isMobile ? 26 : 30,
            borderRadius: 8,
          }} />
        ))}
      </div>

      {/* KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12, marginBottom: 32,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={cardStyle}>
            <div style={{
              ...skBase,
              position: 'absolute', top: 12, right: 12,
              width: 28, height: 28, borderRadius: 8,
            }} />
            <div style={{ ...skBase, width: 80, height: 10, marginBottom: 10 }} />
            <div style={{ ...skBase, width: '55%', height: isMobile ? 22 : 26, marginBottom: 6 }} />
            <div style={{ ...skBase, width: '75%', height: 11 }} />
          </div>
        ))}
      </div>

      {/* Donut + Top exercises */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px, 360px) 1fr',
        gap: 16, marginBottom: 32,
      }}>
        <section style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
          <div style={{ ...skBase, width: 160, height: 12, marginBottom: 18 }} />
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ ...skBase, width: 140, height: 140, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 140 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ ...skBase, width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...skBase, width: `${65 - i * 8}%`, height: 12, marginBottom: 6 }} />
                    <div style={{ ...skBase, width: `${40 - i * 5}%`, height: 9 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...cardStyle, borderRadius: 16, padding: 20 }}>
          <div style={{ ...skBase, width: 140, height: 12, marginBottom: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ ...skBase, width: 26, height: 26, borderRadius: 7, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...skBase, width: `${72 - i * 7}%`, height: 13, marginBottom: 8 }} />
                  <div style={{ ...skBase, width: `${90 - i * 12}%`, height: 6, borderRadius: 999 }} />
                </div>
                <div style={{ ...skBase, width: 36, height: 16, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Прогресс упражнения: заголовок + переключатель режима + chart */}
      <section style={{ ...cardStyle, borderRadius: 16, padding: 20, marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 14, flexWrap: 'wrap',
        }}>
          <div style={{ ...skBase, width: 200, height: 12 }} />
          <div style={{ ...skBase, width: 220, height: 36, borderRadius: 10 }} />
        </div>
        <div style={{ ...skBase, width: 180, height: 32, borderRadius: 10, marginBottom: 18 }} />

        {/* Chart placeholder */}
        <div style={{
          position: 'relative',
          height: isMobile ? 200 : 240,
        }}>
          {/* Y-axis ticks */}
          {[0, 1, 2, 3, 4].map(i => {
            const yPct = 22 + i * ((isMobile ? 200 : 240) - 60) / 4;
            return (
              <div key={i} style={{
                position: 'absolute',
                left: 0, right: 0, top: yPct,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ ...skBase, width: 32, height: 9 }} />
                <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
              </div>
            );
          })}
          {/* Псевдо-волна линии графика */}
          <div style={{
            position: 'absolute',
            left: 52, right: 16,
            top: '38%', height: 56,
            ...skBase,
            borderRadius: 14,
            opacity: 0.55,
          }} />
          {/* X-axis labels */}
          <div style={{
            position: 'absolute',
            left: 52, right: 16, bottom: 4,
            display: 'flex', justifyContent: 'space-between',
          }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ ...skBase, width: 26, height: 10 }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState<number>(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
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

  // Первичная загрузка — показываем скелетон, чтобы layout не «прыгал».
  // При смене периода data остаётся, отображаем реальный контент с loading-плейсхолдерами.
  if (loading && !data) {
    return <AnalyticsSkeleton isMobile={isMobile} />;
  }

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
                    onClick={() => {
                      setDropdownOpen(o => !o);
                      setDropdownSearch('');
                    }}
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
                  {dropdownOpen && (() => {
                    const q = dropdownSearch.trim().toLowerCase();
                    const filtered = q
                      ? data.exercise_names.filter(n => n.toLowerCase().includes(q))
                      : data.exercise_names;
                    return (
                      <div
                        style={{
                          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                          background: 'var(--surface)',
                          border: '1px solid var(--border2)',
                          borderRadius: 10, padding: 4,
                          zIndex: 50,
                          boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
                          display: 'flex', flexDirection: 'column',
                        }}
                      >
                        <div style={{ padding: 4 }}>
                          <input
                            autoFocus
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            placeholder="Поиск упражнения..."
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              padding: '7px 10px',
                              background: 'var(--bg)',
                              border: '1px solid var(--border2)',
                              borderRadius: 8,
                              color: 'var(--text)',
                              fontSize: 12.5,
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div
                          className="an-dropdown"
                          style={{ maxHeight: 220, overflowY: 'auto', padding: 0 }}
                        >
                          {filtered.length === 0 ? (
                            <div style={{
                              padding: '10px', fontSize: 12, color: 'var(--ghost)',
                              textAlign: 'center',
                            }}>
                              Ничего не найдено
                            </div>
                          ) : filtered.map(name => (
                            <button
                              key={name}
                              onClick={() => {
                                setSelectedExercise(name);
                                setDropdownOpen(false);
                                setDropdownSearch('');
                              }}
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
                      </div>
                    );
                  })()}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Тоннаж по тренировкам</h2>
                  <HintIcon text="объём нагрузки: подходы × повторы × вес" />
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Дистанция по тренировкам</h2>
                  <HintIcon text="суммарный километраж за тренировку" />
                </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Упражнения на время</h2>
                  <HintIcon text="планка, растяжка и всё, что измеряется в секундах" />
                </div>
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
