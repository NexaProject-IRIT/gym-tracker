import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTimer } from '../../contexts/TimerContext';
import { Stopwatch } from './Stopwatch';
import { Countdown } from './Countdown';

export const FLOATING_PILL_HEIGHT = 48;
export const FLOATING_PILL_BOTTOM_MOBILE = 80;  // sits above 64px nav bar
export const FLOATING_PILL_BOTTOM_DESKTOP = 24;

const SIDEBAR_WIDTH = 110; // half of 220px sidebar — used to offset pill center on desktop

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
  } catch {}
};

const ClockIcon = ({ active }: { active: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8" />
    <path d="M12 7v5l2.5 2.5" stroke={active ? 'var(--accent)' : 'var(--dim)'} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M7 4l13 8-13 8V4z" fill="var(--accent)" />
  </svg>
);

const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="4" height="16" rx="1.5" fill="var(--accent)" />
    <rect x="15" y="4" width="4" height="16" rx="1.5" fill="var(--accent)" />
  </svg>
);

export const FloatingTimer: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const location = useLocation();
  const isWorkoutDetail = /^\/workouts\/.+/.test(location.pathname);

  const [expanded, setExpanded] = useState(false);
  const {
    activeTab, setActiveTab,
    swTime, isSwRunning, swStartStop,
    tmHours, tmMins, tmSecs,
    tmTimeLeftMs, isTmRunning, tmStartCancel, formatTmTime,
    tmFinished, clearTmFinished,
  } = useTimer();

  useEffect(() => {
    if (tmFinished) {
      playBeep();
      if (typeof navigator.vibrate === 'function') navigator.vibrate([300, 100, 300]);
      clearTmFinished();
    }
  }, [tmFinished, clearTmFinished]);

  // All hooks above — safe to return early now
  if (!isWorkoutDetail) return null;

  const isRunning = activeTab === 'stopwatch' ? isSwRunning : isTmRunning;

  const canPlay = activeTab === 'stopwatch'
    ? true
    : (isTmRunning || tmHours > 0 || tmMins > 0 || tmSecs > 0);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canPlay) return;
    if (activeTab === 'stopwatch') swStartStop();
    else tmStartCancel();
  };

  const collapsedTime = (): string => {
    if (activeTab === 'stopwatch') {
      const s = Math.floor(swTime / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    return formatTmTime(tmTimeLeftMs);
  };

  const hasTime = activeTab === 'stopwatch'
    ? (isSwRunning || swTime > 0)
    : (isTmRunning || tmTimeLeftMs > 0);

  const bottomOffset = isMobile ? FLOATING_PILL_BOTTOM_MOBILE : FLOATING_PILL_BOTTOM_DESKTOP;
  // Desktop: center the pill in the content area (offset by half the sidebar width)
  const leftOffset = isMobile ? '50%' : `calc(${SIDEBAR_WIDTH}px + 50vw)`;

  return (
    <>
      <style>{`
        .ft-play:hover { background: rgba(110,231,183,0.22) !important; transform: scale(1.05); }
        .ft-play:active { transform: scale(0.94) !important; }
        .ft-chevron { transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1); }
        .ft-tab-pill:hover { color: var(--text3) !important; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes ft-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(110,231,183,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(110,231,183,0); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: bottomOffset,
        left: leftOffset,
        transform: 'translateX(-50%)',
        zIndex: 40,
        userSelect: 'none',
        width: 'calc(100vw - 32px)',
        maxWidth: 360,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(110,231,183,0.15)',
        borderRadius: expanded ? 20 : 999,
        overflow: 'hidden',
        transition: 'border-radius 300ms ease',
      }}>

        {/* ── Expanded panel (slides up from collapsed bar) ── */}
        <div style={{
          maxHeight: expanded ? 420 : 0,
          overflow: 'hidden',
          transition: 'max-height 320ms cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}>
          {/* Subtle depth gradient at top */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(180deg, rgba(110,231,183,0.03) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          <div style={{
            transform: expanded ? 'translateY(0)' : 'translateY(14px)',
            opacity: expanded ? 1 : 0,
            transition: expanded
              ? 'opacity 200ms ease 100ms, transform 320ms cubic-bezier(0.34,1.56,0.64,1) 60ms'
              : 'opacity 120ms ease, transform 180ms ease',
            padding: '20px 20px 8px',
            position: 'relative',
            zIndex: 1,
          }}>

            {/* Mode switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{
                background: 'var(--bg)',
                borderRadius: 10,
                padding: 3,
                display: 'inline-flex',
              }}>
                {(['stopwatch', 'timer'] as const).map(tab => (
                  <button
                    key={tab}
                    className="ft-tab-pill"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '7px 20px',
                      borderRadius: 8,
                      border: 'none',
                      borderLeft: activeTab === tab ? `2px solid var(--accent)` : '2px solid transparent',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: activeTab === tab ? 'var(--surface2)' : 'transparent',
                      color: activeTab === tab ? 'var(--text)' : 'var(--dim)',
                      boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                      transition: 'background 200ms ease, color 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
                    }}
                  >
                    {tab === 'stopwatch' ? 'Секундомер' : 'Таймер'}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'stopwatch' ? <Stopwatch /> : <Countdown />}
          </div>
        </div>

        {/* ── Collapsed bar ── always visible, acts as handle ── */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            height: FLOATING_PILL_HEIGHT,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '0 12px 0 16px',
            cursor: 'pointer',
            borderTop: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}
        >
          {/* Left: clock icon + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClockIcon active={isRunning} />
            <span style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.5px',
              color: isRunning ? 'var(--accent)' : 'var(--text)',
              textShadow: isRunning ? '0 0 20px rgba(110,231,183,0.4)' : 'none',
              transition: 'color 300ms ease, text-shadow 300ms ease',
            }}>
              {hasTime ? collapsedTime() : '00:00'}
            </span>
          </div>

          {/* Center: mode label */}
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--dim)',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
          }}>
            {activeTab === 'stopwatch' ? 'Секундомер' : 'Таймер'}
          </span>

          {/* Right: play/pause + chevron */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
          }}>
            <button
              className="ft-play"
              onClick={handlePlayPause}
              style={{
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: '50%',
                background: 'var(--accent-a12)',
                border: '1px solid var(--accent-a20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canPlay ? 'pointer' : 'default',
                opacity: canPlay ? 1 : 0.35,
                transition: 'background 150ms ease, transform 150ms ease',
                flexShrink: 0,
                animation: isRunning ? 'ft-pulse 2s ease infinite' : 'none',
              }}
            >
              {isRunning ? <PauseIcon /> : <PlayIcon />}
            </button>

            <button
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{
                width: 28,
                height: 28,
                minWidth: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <svg
                className="ft-chevron"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M18 15l-6-6-6 6" stroke="var(--dim)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
