import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTimer } from '../../contexts/TimerContext';

export const FLOATING_PILL_HEIGHT = 52;
export const FLOATING_PILL_BOTTOM_MOBILE = 80;
export const FLOATING_PILL_BOTTOM_DESKTOP = 24;

const SIDEBAR_WIDTH = 110;
const QUICK_PRESETS = [1, 2, 3, 5] as const;
const RING_RADIUS = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const playBeep = () => {
  try {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.5, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.6);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.6);
  } catch { /* AudioContext unavailable */ }
};

const fmtSw = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const fmtSwParts = (ms: number): { main: string; cs: string } => {
  const s = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return {
    main: `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`,
    cs: String(cs).padStart(2, '0'),
  };
};

const fmtTm = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ── Glyph buttons (CSS triangles/rects) ──────────────────────────────────────
const PlayGlyph = ({ color = 'currentColor', size = 12 }: { color?: string; size?: number }) => (
  <svg width={size + 2} height={size + 2} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
    <path d="M3 1.5l8.5 5.5L3 12.5V1.5z" fill={color} />
  </svg>
);

const PauseGlyph = ({ color = 'currentColor', size = 12 }: { color?: string; size?: number }) => (
  <svg width={size + 2} height={size + 2} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
    <rect x="2.5" y="1.5" width="3" height="11" rx="1" fill={color} />
    <rect x="8.5" y="1.5" width="3" height="11" rx="1" fill={color} />
  </svg>
);

const StopGlyph = ({ color = 'currentColor', size = 11 }: { color?: string; size?: number }) => (
  <svg width={size + 2} height={size + 2} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="10" height="10" rx="2" fill={color} />
  </svg>
);

const ClockIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" />
    <path d="M12 7v5l2.5 2.5" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Shared building blocks ───────────────────────────────────────────────────
interface BtnProps {
  variant: 'primary' | 'ghost';
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Btn: React.FC<BtnProps> = ({ variant, onClick, disabled, children }) => {
  const isPrimary = variant === 'primary';
  return (
    <button
      className={isPrimary ? 'ft-btn-primary' : 'ft-btn-ghost'}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
        borderRadius: 13, padding: '10px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'transform .12s ease, background .2s ease, color .2s ease',
        ...(isPrimary
          ? { background: 'var(--accent)', color: '#06281c' }
          : { background: 'transparent', color: 'var(--ghost)', boxShadow: '0 0 0 1px var(--border) inset' }),
      }}
    >
      {children}
    </button>
  );
};

// ── Stopwatch view ───────────────────────────────────────────────────────────
const StopwatchView: React.FC = () => {
  const { swTime, isSwRunning, swStartStop, swReset } = useTimer();
  const { main, cs } = fmtSwParts(swTime);
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 2,
        padding: '12px 0 6px',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        color: 'var(--accent)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
          {main}
        </span>
        <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1, opacity: 0.65 }}>
          ,{cs}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <Btn variant="primary" onClick={swStartStop}>
          {isSwRunning ? <PauseGlyph color="#06281c" /> : <PlayGlyph color="#06281c" />}
          {isSwRunning ? 'Пауза' : 'Старт'}
        </Btn>
        <Btn variant="ghost" onClick={swReset} disabled={swTime === 0 && !isSwRunning}>
          <StopGlyph color="currentColor" />
          Сброс
        </Btn>
      </div>
    </>
  );
};

// ── Countdown view ───────────────────────────────────────────────────────────
const CountdownView: React.FC = () => {
  const {
    tmTimeLeftMs, tmTotalMs, isTmRunning, tmFinished,
    tmStartPreset, tmAddMinutes, tmPauseResume, tmReset,
  } = useTimer();

  const hasActive = tmTotalMs > 0 || isTmRunning || tmFinished;
  const isWarn = isTmRunning && tmTimeLeftMs > 0 && tmTimeLeftMs <= 10_000;
  const isDone = tmFinished;

  const progress = tmTotalMs > 0 ? Math.max(0, Math.min(1, tmTimeLeftMs / tmTotalMs)) : 1;
  const ringOffset = RING_CIRCUMFERENCE * (1 - progress);

  const ringColor = isDone ? 'var(--accent)' : (isWarn ? '#fbbf6e' : 'var(--accent)');
  const timeColor = isDone ? 'var(--accent)' : (isWarn ? '#fbbf6e' : 'var(--text)');

  const presetLabel = hasActive && !tmFinished ? 'добавить' : 'быстрый старт';

  const hint = tmFinished
    ? null
    : isTmRunning
      ? 'осталось'
      : (tmTotalMs > 0 ? 'пауза' : null);

  return (
    <>
      {/* Ring with time */}
      <div style={{ position: 'relative', width: 128, height: 128, marginTop: 4 }}>
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r={RING_RADIUS} fill="none" strokeWidth="8" stroke="rgba(255,255,255,0.08)" />
          <circle
            cx="64" cy="64" r={RING_RADIUS}
            fill="none" strokeWidth="8" strokeLinecap="round"
            stroke={ringColor}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            style={{
              transition: 'stroke-dashoffset .9s linear, stroke .3s ease',
              filter: `drop-shadow(0 0 4px ${isWarn ? 'rgba(251,191,110,0.55)' : 'rgba(110,231,183,0.45)'})`,
            }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <span style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: tmFinished ? 18 : 26, fontWeight: 700,
            color: timeColor, letterSpacing: '-0.01em', lineHeight: 1,
            transition: 'color .3s, font-size .2s',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {tmFinished ? 'Готово' : fmtTm(tmTimeLeftMs || tmTotalMs)}
          </span>
          {hint && (
            <span style={{
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ghost)', fontWeight: 600,
            }}>
              {hint}
            </span>
          )}
        </div>
      </div>

      {/* Preset chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
        <span style={{
          fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--ghost)', fontWeight: 600,
        }}>
          {presetLabel}
        </span>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {QUICK_PRESETS.map(mins => (
            <button
              key={mins}
              className="ft-chip"
              onClick={() => hasActive && !tmFinished ? tmAddMinutes(mins) : tmStartPreset(mins)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 999, padding: '5px 11px',
                fontSize: 11, fontWeight: 600, color: 'var(--text2, var(--text))',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background .15s, border-color .15s, color .15s',
              }}
            >
              +{mins} мин
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <Btn
          variant="primary"
          onClick={tmFinished ? tmReset : tmPauseResume}
          disabled={!hasActive}
        >
          {tmFinished
            ? (<><StopGlyph color="#06281c" /> Закрыть</>)
            : isTmRunning
              ? (<><PauseGlyph color="#06281c" /> Пауза</>)
              : (<><PlayGlyph color="#06281c" /> {tmTotalMs > 0 ? 'Продолжить' : 'Старт'}</>)
          }
        </Btn>
        <Btn variant="ghost" onClick={tmReset} disabled={!hasActive}>
          <StopGlyph color="currentColor" />
          Сброс
        </Btn>
      </div>
    </>
  );
};

// ── Main floating timer ──────────────────────────────────────────────────────
export const FloatingTimer: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const location = useLocation();
  const isWorkoutDetail = /^\/workouts\/.+/.test(location.pathname);

  const [expanded, setExpanded] = useState(false);
  const {
    activeTab, setActiveTab,
    swTime, isSwRunning, swStartStop,
    tmTimeLeftMs, tmTotalMs, isTmRunning, tmFinished, tmPauseResume, clearTmFinished,
  } = useTimer();

  // beep + vibrate on countdown finish
  useEffect(() => {
    if (tmFinished) {
      playBeep();
      if (typeof navigator.vibrate === 'function') navigator.vibrate([300, 100, 300]);
    }
  }, [tmFinished]);

  // Auto-clear "Готово" after a few seconds (if user hasn't dismissed)
  useEffect(() => {
    if (!tmFinished) return;
    const id = setTimeout(() => clearTmFinished(), 8000);
    return () => clearTimeout(id);
  }, [tmFinished, clearTmFinished]);

  if (!isWorkoutDetail) return null;

  const isRunning = activeTab === 'stopwatch' ? isSwRunning : isTmRunning;

  const collapsedTime = activeTab === 'stopwatch'
    ? fmtSw(swTime)
    : (tmFinished ? 'Готово' : fmtTm(tmTimeLeftMs || tmTotalMs));

  const hasTime = activeTab === 'stopwatch'
    ? (isSwRunning || swTime > 0)
    : (isTmRunning || tmTimeLeftMs > 0 || tmFinished);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab === 'stopwatch') swStartStop();
    else if (tmTotalMs > 0 || isTmRunning) tmPauseResume();
  };

  const canPlayCollapsed = activeTab === 'stopwatch'
    ? true
    : (isTmRunning || tmTotalMs > 0);

  const bottomOffset = isMobile ? FLOATING_PILL_BOTTOM_MOBILE : FLOATING_PILL_BOTTOM_DESKTOP;
  const leftOffset = isMobile ? '50%' : `calc(${SIDEBAR_WIDTH}px + 50vw)`;

  // Done state for the whole pill (teal flash + glow border)
  const doneState = activeTab === 'timer' && tmFinished;
  const warnState = activeTab === 'timer' && isTmRunning && tmTimeLeftMs > 0 && tmTimeLeftMs <= 10_000;

  return (
    <>
      <style>{`
        @keyframes ft-ping {
          0% { box-shadow: 0 0 0 0 rgba(110,231,183,0.5); }
          70%, 100% { box-shadow: 0 0 0 6px rgba(110,231,183,0); }
        }
        @keyframes ft-flash {
          0%, 100% { background: rgba(26,29,36,0.72); }
          50% { background: rgba(110,231,183,0.22); }
        }
        .ft-pill { transition: border-color .4s ease, box-shadow .4s ease, border-radius 300ms ease; }
        .ft-pill.done {
          border-color: var(--accent) !important;
          box-shadow: 0 24px 50px -16px rgba(0,0,0,0.7), 0 0 40px -4px rgba(110,231,183,0.7) !important;
          animation: ft-flash .6s ease-out 2;
        }
        .ft-pill.warn { border-color: rgba(251,191,110,0.4) !important; }
        .ft-btn-primary:hover { background: #86eec5 !important; }
        .ft-btn-primary:active:not(:disabled) { transform: scale(0.95); }
        .ft-btn-ghost:hover { color: var(--text) !important; box-shadow: 0 0 0 1px rgba(255,255,255,0.18) inset !important; }
        .ft-btn-ghost:active:not(:disabled) { transform: scale(0.95); }
        .ft-chip:hover {
          background: rgba(110,231,183,0.12) !important;
          border-color: rgba(110,231,183,0.35) !important;
          color: var(--accent) !important;
        }
        .ft-chip:active { transform: scale(0.95); }
        .ft-tab:hover { color: var(--text) !important; }
        .ft-chevron { transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      <div
        className={`ft-pill${doneState ? ' done' : ''}${warnState ? ' warn' : ''}`}
        style={{
          position: 'fixed',
          bottom: bottomOffset,
          left: leftOffset,
          transform: 'translateX(-50%)',
          zIndex: 40,
          userSelect: 'none',
          width: 'calc(100vw - 32px)',
          maxWidth: 280,
          background: 'rgba(26,29,36,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(110,231,183,0.22)',
          borderRadius: expanded ? 22 : 999,
          overflow: 'hidden',
          boxShadow: '0 24px 50px -16px rgba(0,0,0,0.7), 0 0 30px -10px rgba(110,231,183,0.25)',
        }}
      >
        {/* Expanded panel */}
        <div style={{
          maxHeight: expanded ? 460 : 0,
          overflow: 'hidden',
          transition: 'max-height 320ms cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{
            transform: expanded ? 'translateY(0)' : 'translateY(14px)',
            opacity: expanded ? 1 : 0,
            transition: expanded
              ? 'opacity 200ms ease 100ms, transform 320ms cubic-bezier(0.34,1.56,0.64,1) 60ms'
              : 'opacity 120ms ease, transform 180ms ease',
            padding: '14px 16px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
            alignItems: 'center',
          }}>
            {/* Tab switcher */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 10, padding: 3,
              display: 'inline-flex',
              alignSelf: 'center',
            }}>
              {(['stopwatch', 'timer'] as const).map(tab => (
                <button
                  key={tab}
                  className="ft-tab"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    background: activeTab === tab ? 'var(--surface)' : 'transparent',
                    color: activeTab === tab ? 'var(--text)' : 'var(--ghost)',
                    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                    transition: 'background .2s, color .2s',
                  }}
                >
                  {tab === 'stopwatch' ? 'Секундомер' : 'Таймер'}
                </button>
              ))}
            </div>

            {activeTab === 'stopwatch' ? <StopwatchView /> : <CountdownView />}
          </div>
        </div>

        {/* Collapsed bar — always visible, doubles as handle */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            height: FLOATING_PILL_HEIGHT,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '0 10px 0 16px',
            cursor: 'pointer',
            borderTop: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}
        >
          {/* Left: clock + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <ClockIcon active={isRunning} />
            <span style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 15, fontWeight: 600, letterSpacing: '0.5px',
              color: isRunning ? 'var(--accent)' : 'var(--text)',
              textShadow: isRunning ? '0 0 20px rgba(110,231,183,0.4)' : 'none',
              transition: 'color 300ms ease, text-shadow 300ms ease',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {hasTime ? collapsedTime : '00:00'}
            </span>
          </div>

          {/* Center: mode label */}
          <span style={{
            fontSize: 10, fontWeight: 600, color: 'var(--ghost)',
            textTransform: 'uppercase', letterSpacing: '0.14em',
          }}>
            {activeTab === 'stopwatch' ? 'Секундомер' : 'Отдых'}
          </span>

          {/* Right: play/pause + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <button
              onClick={handlePlayPause}
              disabled={!canPlayCollapsed}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: canPlayCollapsed ? 'var(--accent-a12)' : 'transparent',
                border: canPlayCollapsed ? '1px solid var(--accent-a20)' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canPlayCollapsed ? 'pointer' : 'default',
                opacity: canPlayCollapsed ? 1 : 0.4,
                flexShrink: 0,
                transition: 'background .15s, transform .15s',
                animation: isRunning ? 'ft-ping 2s ease-out infinite' : 'none',
              }}
            >
              {isRunning
                ? <PauseGlyph color="var(--accent)" size={10} />
                : <PlayGlyph color="var(--accent)" size={10} />
              }
            </button>

            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{
                width: 28, height: 28, background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, flexShrink: 0,
              }}
            >
              <svg
                className="ft-chevron"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M18 15l-6-6-6 6" stroke="var(--ghost)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
