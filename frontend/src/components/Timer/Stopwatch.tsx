import React, { useEffect, useRef } from 'react';
import { useTimer } from '../../contexts/TimerContext';

const LapIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ResetIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M7 4l13 8-13 8V4z" fill="#0f172a" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="5" width="5" height="14" rx="1.5" fill="#ef4444" />
    <rect x="14" y="5" width="5" height="14" rx="1.5" fill="#ef4444" />
  </svg>
);

// Reusable hover state helper via ref
const useHoverStyle = (base: React.CSSProperties, hover: React.CSSProperties) => {
  const ref = useRef<HTMLButtonElement>(null);
  const enter = () => { if (ref.current) Object.assign(ref.current.style, hover); };
  const leave = () => { if (ref.current) Object.assign(ref.current.style, base); };
  const down  = () => { if (ref.current) ref.current.style.transform = 'scale(0.95)'; };
  const up    = () => { if (ref.current) ref.current.style.transform = 'scale(1)'; };
  return { ref, onMouseEnter: enter, onMouseLeave: leave, onMouseDown: down, onMouseUp: up };
};

// Lap row — fades in when new
const LapRow = ({ label, time, isNew }: { label: string; time: string; isNew: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isNew || !ref.current) return;
    ref.current.animate(
      [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 200, easing: 'ease', fill: 'both' }
    );
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        color: '#f1f5f9',
      }}>
        {time}
      </span>
    </div>
  );
};

export const Stopwatch: React.FC = () => {
  const { swTime, isSwRunning, laps, swStartStop, swLapReset, formatSwTime } = useTimer();
  const currentLapTime = swTime - laps.reduce((a, b) => a + b, 0);

  const lapResetBtn = useHoverStyle(
    { background: 'rgba(255,255,255,0.06)' },
    { background: 'rgba(255,255,255,0.11)' },
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Time display */}
      <div style={{
        fontSize: 52,
        fontWeight: 200,
        letterSpacing: '-2px',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'center',
        margin: '16px 0',
        color: isSwRunning ? '#6ee7b7' : '#e2e8f0',
        textShadow: isSwRunning ? '0 0 40px rgba(110,231,183,0.3)' : 'none',
        transition: 'color 300ms ease, text-shadow 300ms ease',
        lineHeight: 1,
      }}>
        {formatSwTime(swTime)}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>

        {/* Lap / Reset */}
        <button
          ref={lapResetBtn.ref}
          onClick={swLapReset}
          onMouseEnter={lapResetBtn.onMouseEnter}
          onMouseLeave={lapResetBtn.onMouseLeave}
          onMouseDown={lapResetBtn.onMouseDown}
          onMouseUp={lapResetBtn.onMouseUp}
          style={{
            width: 56,
            height: 56,
            minWidth: 56,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 150ms ease, transform 150ms ease',
          }}
        >
          {isSwRunning ? <LapIcon /> : <ResetIcon />}
        </button>

        {/* Start / Stop */}
        <button
          onClick={swStartStop}
          onMouseEnter={e => {
            if (isSwRunning) {
              e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
            } else {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(110,231,183,0.45)';
            }
          }}
          onMouseLeave={e => {
            if (isSwRunning) {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
            } else {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(110,231,183,0.3)';
            }
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          style={{
            width: 56,
            height: 56,
            minWidth: 56,
            borderRadius: '50%',
            background: isSwRunning
              ? 'rgba(239,68,68,0.15)'
              : 'linear-gradient(135deg, #6ee7b7, #34d399)',
            border: isSwRunning ? '1px solid rgba(239,68,68,0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isSwRunning ? 'none' : '0 4px 16px rgba(110,231,183,0.3)',
            transition: 'all 150ms ease',
          }}
        >
          {isSwRunning ? <StopIcon /> : <PlayIcon />}
        </button>
      </div>

      {/* Laps */}
      {(laps.length > 0 || isSwRunning) && (
        <div style={{
          width: '100%',
          maxHeight: 80,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 2,
        }}>
          {isSwRunning && (
            <LapRow
              label={`Круг ${laps.length + 1}`}
              time={formatSwTime(currentLapTime)}
              isNew={false}
            />
          )}
          {laps.map((lapTime, i) => (
            <LapRow
              key={laps.length - i}
              label={`Круг ${laps.length - i}`}
              time={formatSwTime(lapTime)}
              isNew={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
