import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { apiFetch } from '../lib/api';
import { WorkoutSummaryWidget } from '../components/Home/WorkoutSummaryWidget';

// ─── мотивационные фразы (40 шт., стабильный выбор по дню года) ────────────
const QUOTES: { text: string; tag: string }[] = [
  { text: 'Сила не приходит из физических возможностей. Она исходит из несгибаемой воли.', tag: 'Махатма Ганди' },
  { text: 'Тело достигает того, во что верит разум.', tag: 'мотивация дня' },
  { text: 'Боль, которую ты чувствуешь сегодня, — это сила, которую ты почувствуешь завтра.', tag: 'мотивация дня' },
  { text: 'Каждое повторение приближает тебя к версии лучшего себя.', tag: 'мотивация дня' },
  { text: 'Дисциплина — это выбирать то, чего хочешь сильнее всего, вместо того, что хочешь прямо сейчас.', tag: 'мотивация дня' },
  { text: 'Не считай дни — заставь дни считаться.', tag: 'Мохаммед Али' },
  { text: 'Никогда не пропускай понедельник.', tag: 'фитнес-правило' },
  { text: 'Тренировка длится час, твой день — двадцать четыре.', tag: 'мотивация дня' },
  { text: 'Лучшее время начать было вчера. Второе лучшее — сейчас.', tag: 'мотивация дня' },
  { text: 'Сильное тело строится из маленьких ежедневных решений.', tag: 'мотивация дня' },
  { text: 'Ты не устал — ты ленив. Это разные вещи.', tag: 'мотивация дня' },
  { text: 'Никто не пожалел о тренировке после неё.', tag: 'мотивация дня' },
  { text: 'Прогресс важнее совершенства.', tag: 'мотивация дня' },
  { text: 'Если устал — отдохни, а не сдавайся.', tag: 'Бэнкси' },
  { text: 'Мышцы не растут от мыслей о подходе.', tag: 'мотивация дня' },
  { text: 'Самое тяжёлое в тренировке — начать её.', tag: 'мотивация дня' },
  { text: 'Тело — это инструмент. Затачивай его регулярно.', tag: 'мотивация дня' },
  { text: 'Сегодняшняя версия тебя должна быть сильнее вчерашней.', tag: 'мотивация дня' },
  { text: 'Привычка — это новый талант.', tag: 'мотивация дня' },
  { text: 'Маленькие усилия каждый день побеждают огромный рывок раз в месяц.', tag: 'мотивация дня' },
  { text: 'Зеркало не врёт. Но врёт мозг, который не хочет идти в зал.', tag: 'мотивация дня' },
  { text: 'Хочешь — найдёшь способ. Не хочешь — найдёшь оправдание.', tag: 'мотивация дня' },
  { text: 'Сильные люди не появляются за день. Они появляются за тысячу дней.', tag: 'мотивация дня' },
  { text: 'Сначала ты ведёшь дневник тренировок. Потом он ведёт тебя.', tag: 'мотивация дня' },
  { text: 'Пот — это жир, плачущий о пощаде.', tag: 'мотивация дня' },
  { text: 'Каждое движение — голос за того, кем ты хочешь стать.', tag: 'мотивация дня' },
  { text: 'Усталость уйдёт. Гордость останется.', tag: 'мотивация дня' },
  { text: 'Ты сильнее, чем твой последний отказ.', tag: 'мотивация дня' },
  { text: 'Сначала тяжело. Потом ритм. Потом — образ жизни.', tag: 'мотивация дня' },
  { text: 'Тренировка — это инвестиция, а не расход времени.', tag: 'мотивация дня' },
  { text: 'Лучший подход — следующий.', tag: 'мотивация дня' },
  { text: 'Большие изменения начинаются с одного отжимания.', tag: 'мотивация дня' },
  { text: 'Слабые желания дают слабые результаты.', tag: 'Наполеон Хилл' },
  { text: 'Боль временна. Бросить — навсегда.', tag: 'Лэнс Армстронг' },
  { text: 'Тело отзеркаливает то, что ты в него вкладываешь.', tag: 'мотивация дня' },
  { text: 'Каждый день — новая страница. Не оставляй её пустой.', tag: 'мотивация дня' },
  { text: 'Никакого «потом». Только «сейчас».', tag: 'мотивация дня' },
  { text: 'Двигайся ежедневно, даже когда не хочется. Особенно когда не хочется.', tag: 'мотивация дня' },
  { text: 'Лёгкий день в зале лучше идеального дня на диване.', tag: 'мотивация дня' },
  { text: 'Если ты не делаешь это сегодня — почему оно случится завтра?', tag: 'мотивация дня' },
];

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTH_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MILESTONES = [5, 10, 25, 50, 100, 200, 500, 1000];

const fmtDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayOfYear = (d: Date): number => {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
};

const getMondayOf = (d: Date): Date => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  const dow = r.getDay();
  const offset = (dow + 6) % 7;
  r.setDate(r.getDate() - offset);
  return r;
};

const greetingFor = (hour: number): string => {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  if (hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
};

// ─── SVG-иконки ────────────────────────────────────────────────────────────

const IconSparkle = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);
const IconRepeat = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 2l4 4-4 4M21 6H9a4 4 0 0 0-4 4v0M7 22l-4-4 4-4M3 18h12a4 4 0 0 0 4-4v0" />
  </svg>
);
const IconArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);
const IconFlame = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .3-2 1-3 .5 1 1.5 1 2 0 0-2-1-3-1-5 1 0 2 0 2 0z" />
    <path d="M9 14a5 5 0 1 0 6 0c-.2 1.5-1.4 2.5-3 2.5s-2.8-1-3-2.5z" />
  </svg>
);
const IconTrophy = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h12v4a6 6 0 0 1-12 0V4z" />
    <path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3" />
    <path d="M12 14v4M8 21h8M10 18h4" />
  </svg>
);
const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5L20 6" />
  </svg>
);
const IconBrain = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5M9.5 2A4.5 4.5 0 0 0 5 6.5v0A4.5 4.5 0 0 0 9.5 11M9.5 2h5M14.5 2A4.5 4.5 0 0 1 19 6.5v0A4.5 4.5 0 0 1 14.5 11M9.5 11v8a2.5 2.5 0 0 0 5 0v-8M9.5 11h5M7 11.5a2.5 2.5 0 0 0 0 5h2.5M17 11.5a2.5 2.5 0 0 1 0 5h-2.5" />
  </svg>
);

// ─── AI-подсказки (меняются каждый день) ─────────────────────────────────
const AI_TIPS: { hint: string; prompt: string }[] = [
  {
    hint: 'Что реально улучшилось за последнее время?',
    prompt: 'Проанализируй мои последние тренировки и скажи: что конкретно прогрессирует — веса, объём, частота? Приведи примеры из моей истории.',
  },
  {
    hint: 'Есть ли у меня слабые места в программе?',
    prompt: 'Посмотри на мою историю тренировок и найди слабые места: какие мышечные группы я прокачиваю редко или с малым весом? Что стоит добавить или усилить?',
  },
  {
    hint: 'Достаточно ли я восстанавливаюсь между тренировками?',
    prompt: 'Оцени мой режим восстановления по истории тренировок: как часто я тренируюсь, есть ли признаки перетренированности или наоборот — слишком редкие тренировки?',
  },
  {
    hint: 'Стоит ли мне взять разгрузочную неделю?',
    prompt: 'Проанализируй мою нагрузку за последние несколько недель. Нужна ли мне разгрузочная неделя прямо сейчас? Объясни почему.',
  },
  {
    hint: 'На каком упражнении сосредоточиться прямо сейчас?',
    prompt: 'Посмотри на мою историю и определи: над каким конкретным упражнением мне сейчас стоит работать больше всего и почему?',
  },
  {
    hint: 'Что мне попробовать в следующей тренировке?',
    prompt: 'Предложи что-то новое для моей следующей тренировки — упражнение, схему подходов или подход, которого нет в моей обычной программе. Обоснуй почему это будет полезно.',
  },
  {
    hint: 'Как скорректировать нагрузку на следующей неделе?',
    prompt: 'Исходя из моих последних тренировок, как лучше выстроить нагрузку на следующей неделе — какие дни, какие группы мышц, примерный объём?',
  },
  {
    hint: 'Прогрессирую ли я на самом деле?',
    prompt: 'Честно скажи: есть ли реальный прогресс в моих тренировках или я топчусь на месте? Посмотри на веса и объём за последние недели.',
  },
  {
    hint: 'Какая мышечная группа отстаёт больше всего?',
    prompt: 'По моей истории тренировок определи: какую мышечную группу я тренирую меньше всего или с наименьшей интенсивностью? Что именно нужно исправить?',
  },
  {
    hint: 'Что я делаю хорошо в своих тренировках?',
    prompt: 'Найди в моей истории тренировок то, что я делаю правильно и стабильно. Похвали конкретные вещи — это поможет мне понять, что стоит продолжать.',
  },
  {
    hint: 'Достаточно ли часто я тренируюсь?',
    prompt: 'Оцени частоту моих тренировок: тренируюсь ли я достаточно для прогресса или слишком редко? Что рекомендуешь изменить в расписании?',
  },
  {
    hint: 'Где у меня стагнация по весам?',
    prompt: 'Проанализируй мои рабочие веса за последние недели. Какие упражнения стоят на месте без роста? Что можно сделать, чтобы сдвинуть прогресс?',
  },
  {
    hint: 'Как моя тренировочная неделя по сравнению с прошлой?',
    prompt: 'Сравни мои тренировки этой недели с прошлой: что изменилось по объёму, интенсивности, набору упражнений? Есть ли тренд?',
  },
  {
    hint: 'Что поменять в программе для лучшего результата?',
    prompt: 'Предложи конкретные изменения в моей тренировочной программе исходя из последних недель. Что убрать, что добавить, что скорректировать по весам или объёму?',
  },
  {
    hint: 'Я тренируюсь эффективно или просто хожу в зал?',
    prompt: 'Посмотри на мою историю тренировок критически: есть ли признаки реальной прогрессии нагрузки, или я просто хожу в зал без системы? Будь честным.',
  },
];

// ─── главный компонент ───────────────────────────────────────────────────
export const HomePage = () => {
  const navigate = useNavigate();
  const { workouts, loading, fetchWorkouts, repeatWorkout } = useWorkoutsContext();
  const [now] = useState(() => new Date());
  const [userName, setUserName] = useState<string>(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.display_name || u.username || '';
    } catch { return ''; }
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [repeatingId, setRepeatingId] = useState<string | null>(null);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    apiFetch<{ username?: string; display_name?: string }>('/auth/profile/')
      .then(d => {
        const n = d.display_name || d.username || '';
        if (n) setUserName(n);
        localStorage.setItem('user', JSON.stringify(d));
      })
      .catch(() => {});
  }, []);

  // ─── деривативные данные ────────────────────────────────────────────
  const hour = now.getHours();
  const greeting = greetingFor(hour);
  const quote = QUOTES[dayOfYear(now) % QUOTES.length];

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) {
      if (!w.date) continue;
      const key = w.date.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [workouts]);

  const mondayThisWeek = useMemo(() => getMondayOf(now), [now]);

  // 5-недельная сетка (7 колонок × 5 строк), правый нижний угол = сегодня
  const gridCells = useMemo(() => {
    const cells: { date: Date; key: string; count: number; isToday: boolean; isFuture: boolean }[] = [];
    const startDate = new Date(mondayThisWeek);
    startDate.setDate(mondayThisWeek.getDate() - 28);
    const todayKey = fmtDate(now);
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = fmtDate(d);
      cells.push({
        date: d,
        key,
        count: workoutsByDate.get(key) ?? 0,
        isToday: key === todayKey,
        isFuture: d.getTime() > now.getTime() && key !== todayKey,
      });
    }
    return cells;
  }, [mondayThisWeek, workoutsByDate, now]);

  // 8 последних недель — для барчарта
  const weeklyBars = useMemo(() => {
    const bars: { weekStart: Date; count: number; isCurrent: boolean }[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(mondayThisWeek);
      weekStart.setDate(mondayThisWeek.getDate() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      let count = 0;
      for (const wk of workouts) {
        if (!wk.date) continue;
        const wd = new Date(wk.date);
        if (wd >= weekStart && wd < weekEnd) count++;
      }
      bars.push({ weekStart, count, isCurrent: w === 0 });
    }
    return bars;
  }, [workouts, mondayThisWeek]);

  // Недельный стрик (текущая неделя без тренировок — не сбрасывает)
  const weeklyStreak = useMemo(() => {
    let streak = 0;
    for (let w = 0; w < 200; w++) {
      const ws = new Date(mondayThisWeek);
      ws.setDate(mondayThisWeek.getDate() - w * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 7);
      const has = workouts.some(wk => {
        if (!wk.date) return false;
        const wd = new Date(wk.date);
        return wd >= ws && wd < we;
      });
      if (has) streak++;
      else if (w === 0) continue;
      else break;
    }
    return streak;
  }, [workouts, mondayThisWeek]);

  const totalWorkouts = workouts.length;
  const nextMilestone = MILESTONES.find(m => m > totalWorkouts) ?? null;
  const milestoneRemaining = nextMilestone != null ? nextMilestone - totalWorkouts : null;
  const milestoneProgress = nextMilestone != null
    ? Math.min(1, totalWorkouts / nextMilestone) : 1;

  const lastWorkout = useMemo(() => {
    if (!workouts.length) return null;
    return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [workouts]);

  const maxBar = Math.max(1, ...weeklyBars.map(b => b.count));

  const onStartNew = () => navigate('/workouts', { state: { modal: 'form' } });

  const aiTip = AI_TIPS[dayOfYear(now) % AI_TIPS.length];
  const onAiAdvice = () => navigate('/ai', { state: { autoPrompt: aiTip.prompt } });

  const onRepeatLast = async () => {
    if (!lastWorkout || repeatingId) return;
    setRepeatingId(lastWorkout.id);
    const newId = await repeatWorkout(lastWorkout.id);
    setRepeatingId(null);
    if (newId) navigate(`/workouts/${newId}`);
  };

  // ─── стили (инлайн в JSX ниже) ─────────────────────────────────────
  const wrapMaxWidth = 760;
  const sidePad = isMobile ? 20 : 32;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-fade { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .dash-press { transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s; }
        .dash-press:active { transform: scale(0.98); }
        .dash-cta:hover { box-shadow: 0 12px 36px var(--accent-a30); transform: translateY(-1px); }
        .dash-cta:active { transform: translateY(0) scale(0.99); }
        .dash-cell-hover { transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
        .dash-cell-hover:hover { transform: scale(1.18); z-index: 2; }
        .dash-bar { transition: opacity 0.15s; }
        .dash-bar:hover { opacity: 0.85; }
        .dash-skel { background: linear-gradient(90deg, var(--surface2) 0%, var(--surface) 50%, var(--surface2) 100%); background-size: 200% 100%; animation: shimmer 1.6s linear infinite; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        paddingBottom: 80,
      }}>
        <div style={{
          maxWidth: wrapMaxWidth,
          margin: '0 auto',
          padding: `${isMobile ? 28 : 44}px ${sidePad}px 0`,
        }}>

          {/* ── ШАПКА ── приветствие ── */}
          <header
            className="dash-fade"
            style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? 30 : 38,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: 'var(--text)',
              }}>
                {greeting},
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{userName || 'спортсмен'}</span>
              </h1>
            </div>
          </header>

          {/* ── СВОДКА ТРЕНИРОВКИ ── */}
          <div className="dash-fade" style={{ marginBottom: 18, animationDelay: '60ms' }}>
            <WorkoutSummaryWidget
              lastWorkout={lastWorkout}
              weeklyStreak={weeklyStreak}
              onStart={onStartNew}
            />
          </div>

          {/* ── ЦИТАТА ── */}
          <div
            className="dash-fade"
            style={{
              position: 'relative',
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              borderRadius: 20,
              padding: isMobile ? '18px 18px 18px 20px' : '20px 22px',
              marginBottom: 18,
              animationDelay: '120ms',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 28px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            {/* левая акцентная полоса */}
            <div style={{
              position: 'absolute', top: 16, bottom: 16, left: 0,
              width: 3, borderRadius: 4,
              background: 'linear-gradient(180deg, var(--accent), var(--accent2))',
            }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                flexShrink: 0,
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--accent-a12)',
                border: '1px solid var(--accent-a20)',
                color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconSparkle size={14} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: isMobile ? 14.5 : 15,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: 'var(--text2)',
                  letterSpacing: '-0.005em',
                }}>
                  {quote.text}
                </div>
                <div style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--ghost)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}>
                  — {quote.tag}
                </div>
              </div>
            </div>
          </div>

          {/* ── Дополнительные действия (повтор + AI) ── */}
          <div className="dash-fade" style={{ marginBottom: 28, animationDelay: '180ms' }}>
            {lastWorkout && (
              <button
                onClick={onRepeatLast}
                disabled={!!repeatingId}
                className="dash-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  width: '100%', padding: '13px 18px',
                  borderRadius: 14,
                  background: 'var(--surface)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text3)',
                  fontWeight: 500, fontSize: 13.5,
                  cursor: repeatingId ? 'wait' : 'pointer',
                  opacity: repeatingId ? 0.6 : 1,
                  letterSpacing: '-0.005em',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ color: 'var(--accent)', display: 'flex' }}><IconRepeat size={15} /></span>
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    Повторить: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{lastWorkout.name || 'последнюю'}</span>
                  </span>
                </span>
                <span style={{ color: 'var(--ghost)', fontSize: 12 }}>
                  {new Date(lastWorkout.date).getDate()} {MONTH_SHORT[new Date(lastWorkout.date).getMonth()]}
                </span>
              </button>
            )}

            {totalWorkouts >= 3 && (
              <button
                onClick={onAiAdvice}
                className="dash-press"
                style={{
                  marginTop: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 14px 12px 16px',
                  borderRadius: 14,
                  background: 'rgba(110,231,183,0.04)',
                  border: '1px solid var(--accent-a20)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: 9,
                  background: 'var(--accent-a12)', border: '1px solid var(--accent-a20)',
                  color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconBrain size={14} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    display: 'block', fontSize: 10, fontWeight: 600,
                    color: 'var(--accent)', letterSpacing: '0.07em',
                    textTransform: 'uppercase', marginBottom: 2,
                  }}>GymBot</span>
                  <span style={{
                    display: 'block', fontSize: 13, fontWeight: 500,
                    color: 'var(--text3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '-0.005em',
                  }}>{aiTip.hint}</span>
                </span>
                <span style={{ flexShrink: 0, color: 'var(--accent)', opacity: 0.5 }}>
                  <IconArrowRight size={13} />
                </span>
              </button>
            )}
          </div>

          {/* ── СТАТИСТИКА (3 числа без карточек) ── */}
          <div
            className="dash-fade"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              marginBottom: 36,
              animationDelay: '180ms',
            }}
          >
            <StatCell
              icon={<IconFlame size={14} />}
              label="стрик"
              value={weeklyStreak}
              unit={weeklyStreak === 1 ? 'нед' : 'нед'}
              accent="#fb923c"
              loading={loading && !workouts.length}
              borderRight
            />
            <StatCell
              icon={<IconCheck size={14} />}
              label="всего"
              value={totalWorkouts}
              accent="var(--accent)"
              loading={loading && !workouts.length}
              borderRight
            />
            <StatCell
              icon={<IconTrophy size={14} />}
              label={nextMilestone ? `до ${nextMilestone}` : 'мастер'}
              value={milestoneRemaining ?? 0}
              unit={milestoneRemaining ? 'осталось' : ''}
              accent="#c4b5fd"
              loading={loading && !workouts.length}
              progress={milestoneProgress}
            />
          </div>

          {/* ── СЕТКА АКТИВНОСТИ ── */}
          <section className="dash-fade" style={{ marginBottom: 36, animationDelay: '240ms' }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <h2 style={{
                margin: 0, fontSize: 13, fontWeight: 700,
                color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Активность · 5 недель
              </h2>
              <div className="num-mono" style={{ fontSize: 11.5, color: 'var(--ghost)' }}>
                {gridCells.filter(c => !c.isFuture && c.count > 0).length} из {gridCells.filter(c => !c.isFuture).length} дней
              </div>
            </div>

            {/* подписи дней недели */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: isMobile ? 6 : 8,
              marginBottom: 8,
            }}>
              {WEEKDAY_LABELS.map((d, i) => (
                <div key={d} className="num-mono" style={{
                  textAlign: 'center', fontSize: 10.5, fontWeight: 500,
                  color: (i === 5 || i === 6) ? 'var(--faint)' : 'var(--dim)',
                  letterSpacing: '0.04em',
                }}>{d}</div>
              ))}
            </div>

            {/* клетки */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: isMobile ? 6 : 8,
              position: 'relative',
            }}>
              {gridCells.map((cell, i) => {
                const hovered = hoveredCell === i;
                const tone = cell.isFuture
                  ? 'rgba(255,255,255,0.025)'
                  : cell.count === 0
                    ? 'var(--surface2)'
                    : cell.count === 1
                      ? 'var(--accent-a25)'
                      : 'var(--accent)';
                const border = cell.isToday
                  ? '1.5px solid var(--accent)'
                  : cell.isFuture
                    ? '1px dashed var(--border)'
                    : `1px solid ${cell.count > 0 ? 'var(--accent-a30)' : 'var(--border)'}`;
                return (
                  <div
                    key={cell.key}
                    className="dash-cell-hover"
                    onMouseEnter={() => setHoveredCell(i)}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: isMobile ? 8 : 10,
                      background: tone,
                      border,
                      position: 'relative',
                      cursor: cell.isFuture ? 'default' : 'pointer',
                    }}
                  >
                    {cell.isToday && (
                      <div style={{
                        position: 'absolute',
                        right: 4, top: 4,
                        width: 5, height: 5, borderRadius: '50%',
                        background: cell.count > 0 ? 'var(--accent-fg)' : 'var(--accent)',
                        animation: 'pulseDot 2.4s ease-in-out infinite',
                      }} />
                    )}
                    {hovered && !cell.isFuture && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--text)',
                        color: 'var(--bg)',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '5px 9px',
                        borderRadius: 7,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 5,
                        letterSpacing: '-0.005em',
                      }}>
                        {cell.date.getDate()} {MONTH_SHORT[cell.date.getMonth()]}
                        {' · '}
                        <span style={{ color: cell.count > 0 ? '#fbbf24' : 'currentColor', opacity: cell.count > 0 ? 1 : 0.6 }}>
                          {cell.count > 0 ? `${cell.count} трен.` : 'отдых'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* легенда */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: 6, marginTop: 12, fontSize: 10.5, color: 'var(--ghost)',
              letterSpacing: '0.04em',
            }}>
              <span>меньше</span>
              {[ 'var(--surface2)', 'var(--accent-a25)', 'var(--accent)' ].map((c, i) => (
                <div key={i} style={{
                  width: 11, height: 11, borderRadius: 3, background: c,
                  border: i === 0 ? '1px solid var(--border)' : `1px solid var(--accent-a30)`,
                }} />
              ))}
              <span>больше</span>
            </div>
          </section>

          {/* ── BAR CHART ── */}
          <section className="dash-fade" style={{ marginBottom: 24, animationDelay: '300ms' }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <h2 style={{
                margin: 0, fontSize: 13, fontWeight: 700,
                color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Тренировок в неделю · 8 нед
              </h2>
              <div className="num-mono" style={{ fontSize: 11.5, color: 'var(--ghost)' }}>
                ⌀ {(weeklyBars.reduce((s, b) => s + b.count, 0) / 8).toFixed(1)} / нед
              </div>
            </div>

            <WeeklyBarChart
              bars={weeklyBars}
              maxValue={maxBar}
              hoveredIdx={hoveredBar}
              onHover={setHoveredBar}
              isMobile={isMobile}
            />
          </section>

          {/* ── ПОДСКАЗКА если ноль тренировок ── */}
          {!loading && totalWorkouts === 0 && (
            <div
              className="dash-fade"
              style={{
                background: 'var(--accent-a10)',
                border: '1px dashed var(--accent-a30)',
                borderRadius: 16,
                padding: 18,
                display: 'flex', gap: 12, alignItems: 'center',
                animationDelay: '360ms',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--accent-a20)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconSparkle size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                  Запиши первую тренировку
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--dim)', lineHeight: 1.5 }}>
                  Дашборд оживёт сразу — статистика, активность и график за неделю
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

// ─── StatCell ─────────────────────────────────────────────────────────────
interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit?: string;
  accent: string;
  loading?: boolean;
  borderRight?: boolean;
  progress?: number; // 0..1 — рисует тонкую полосу снизу
}
const StatCell = ({ icon, label, value, unit, accent, loading, borderRight, progress }: StatCellProps) => (
  <div style={{
    padding: '14px 14px 16px',
    borderRight: borderRight ? '1px solid var(--border)' : 'none',
    position: 'relative',
    minWidth: 0,
  }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 5,
      fontSize: 10.5, fontWeight: 600,
      color: 'var(--ghost)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: 8,
    }}>
      <span style={{ color: accent, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ lineHeight: 1.35 }}>{label}</span>
    </div>
    {loading ? (
      <div className="dash-skel" style={{ height: 28, width: '60%', borderRadius: 6 }} />
    ) : (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="num-mono" style={{
          fontSize: 26, fontWeight: 700, color: 'var(--text)',
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 11, color: 'var(--dim)', fontWeight: 500 }}>{unit}</span>
        )}
      </div>
    )}
    {progress != null && (
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 4,
        height: 2, borderRadius: 2,
        background: 'var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: accent,
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    )}
  </div>
);

// ─── WeeklyBarChart (чистый SVG) ──────────────────────────────────────────
interface BarData { weekStart: Date; count: number; isCurrent: boolean }
interface WeeklyBarChartProps {
  bars: BarData[];
  maxValue: number;
  hoveredIdx: number | null;
  onHover: (i: number | null) => void;
  isMobile: boolean;
}
const WeeklyBarChart = ({ bars, maxValue, hoveredIdx, onHover, isMobile }: WeeklyBarChartProps) => {
  const W = 100;
  const H = isMobile ? 36 : 32;
  const barW = (W - (bars.length - 1) * 1.4) / bars.length;
  const heightFor = (c: number) => Math.max(c > 0 ? 4 : 1.5, (c / maxValue) * H);

  return (
    <div style={{ position: 'relative' }}>
      {/* baseline + gridlines */}
      <svg viewBox={`0 -2 ${W} ${H + 8}`} width="100%" preserveAspectRatio="none" style={{ display: 'block', height: isMobile ? 130 : 140 }}>
        {/* gridline на максимуме */}
        <line x1="0" y1="0" x2={W} y2="0"
          stroke="var(--border)" strokeWidth="0.15" strokeDasharray="0.6,0.8" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="var(--border)" strokeWidth="0.15" strokeDasharray="0.6,0.8" vectorEffect="non-scaling-stroke" />

        {bars.map((b, i) => {
          const h = heightFor(b.count);
          const x = i * (barW + 1.4);
          const y = H - h;
          const hov = hoveredIdx === i;
          const fill = b.count === 0
            ? 'var(--surface3)'
            : b.isCurrent
              ? 'var(--accent)'
              : 'var(--accent-a30)';
          return (
            <g key={i}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
              className="dash-bar"
              style={{ cursor: 'pointer' }}
            >
              {/* hit area */}
              <rect x={x - 0.3} y={-2} width={barW + 0.6} height={H + 4} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={Math.min(1.2, barW / 3)}
                fill={fill}
                opacity={hov ? 1 : (b.count === 0 ? 0.45 : 0.92)}
                style={{ transition: 'opacity 0.15s' }}
              />
              {b.isCurrent && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={Math.min(1.2, barW / 3)}
                  fill="none"
                  stroke="var(--accent-fg)"
                  strokeWidth="0.12"
                  opacity="0.18"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* подписи под барами */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${bars.length}, 1fr)`,
        gap: 0,
        marginTop: 6,
      }}>
        {bars.map((b, i) => {
          const hov = hoveredIdx === i;
          const dateStr = `${b.weekStart.getDate()} ${MONTH_SHORT[b.weekStart.getMonth()]}`;
          return (
            <div key={i} className="num-mono" style={{
              textAlign: 'center',
              fontSize: 10,
              color: hov ? 'var(--text)' : (b.isCurrent ? 'var(--accent)' : 'var(--ghost)'),
              fontWeight: b.isCurrent ? 700 : 500,
              transition: 'color 0.15s',
              letterSpacing: '-0.01em',
            }}>
              {b.isCurrent ? 'сейчас' : dateStr}
            </div>
          );
        })}
      </div>

      {/* tooltip числа над активным баром */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          left: `${(hoveredIdx + 0.5) / bars.length * 100}%`,
          top: -28,
          transform: 'translateX(-50%)',
          background: 'var(--text)',
          color: 'var(--bg)',
          padding: '5px 9px',
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          letterSpacing: '-0.005em',
        }}>
          <span className="num-mono">{bars[hoveredIdx].count}</span>
          {' '}
          {bars[hoveredIdx].count === 1 ? 'тренировка' : bars[hoveredIdx].count < 5 && bars[hoveredIdx].count !== 0 ? 'тренировки' : 'тренировок'}
        </div>
      )}
    </div>
  );
};
