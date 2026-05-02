import React, { useRef } from 'react';
import { useTimer } from '../../contexts/TimerContext';

interface NumInputProps {
  value: number;
  onChange: (v: number) => void;
  max: number;
  label: string;
}

const NumInput = ({ value, onChange, max, label }: NumInputProps) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (!ref.current) return;
    ref.current.style.borderColor = 'rgba(110,231,183,0.5)';
    ref.current.style.boxShadow = '0 0 0 3px rgba(110,231,183,0.1)';
    ref.current.select();
  };

  const handleBlur = () => {
    if (!ref.current) return;
    ref.current.style.borderColor = 'rgba(255,255,255,0.08)';
    ref.current.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <input
        ref={ref}
        type="number"
        min={0}
        max={max}
        value={String(value).padStart(2, '0')}
        onChange={e => {
          const v = Math.min(max, Math.max(0, parseInt(e.target.value) || 0));
          onChange(v);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: 56,
          background: '#111318',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 300,
          color: '#f1f5f9',
          padding: '8px 0',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      />
      <span style={{
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
};

const Separator = () => (
  <span style={{
    fontSize: 24,
    color: '#64748b',
    paddingBottom: 16,
    lineHeight: 1,
    alignSelf: 'flex-end',
    marginBottom: 2,
  }}>
    :
  </span>
);

const QUICK_PRESETS = [1, 2, 3, 5, 10] as const;

export const Countdown: React.FC = () => {
  const {
    tmHours, tmMins, tmSecs,
    setTmHours, setTmMins, setTmSecs,
    tmTimeLeftMs, isTmRunning,
    tmStartCancel, tmPreset, formatTmTime,
  } = useTimer();

  const canStart = tmHours > 0 || tmMins > 0 || tmSecs > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Time display — large font, always visible */}
      <div style={{
        fontSize: 52,
        fontWeight: 200,
        letterSpacing: '-2px',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'center',
        margin: '16px 0 12px',
        color: isTmRunning ? '#6ee7b7' : '#e2e8f0',
        textShadow: isTmRunning ? '0 0 40px rgba(110,231,183,0.3)' : 'none',
        transition: 'color 300ms ease, text-shadow 300ms ease',
        lineHeight: 1,
      }}>
        {isTmRunning
          ? formatTmTime(tmTimeLeftMs)
          : `${String(tmHours).padStart(2, '0')}:${String(tmMins).padStart(2, '0')}:${String(tmSecs).padStart(2, '0')}`
        }
      </div>

      {/* Setup controls — hidden while running */}
      {!isTmRunning && (
        <>
          {/* Time inputs */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            marginBottom: 14,
          }}>
            <NumInput value={tmHours} onChange={setTmHours} max={23} label="Часы" />
            <Separator />
            <NumInput value={tmMins} onChange={setTmMins} max={59} label="Мин" />
            <Separator />
            <NumInput value={tmSecs} onChange={setTmSecs} max={59} label="Сек" />
          </div>

          {/* Quick start pills */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {QUICK_PRESETS.map(mins => (
              <button
                key={mins}
                onClick={() => tmPreset(mins)}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(110,231,183,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(110,231,183,0.3)';
                  e.currentTarget.style.color = '#6ee7b7';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {mins} мин
              </button>
            ))}
          </div>
        </>
      )}

      {/* Start / Stop button */}
      <button
        onClick={tmStartCancel}
        disabled={!isTmRunning && !canStart}
        onMouseEnter={e => {
          if (isTmRunning) {
            e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
          } else if (canStart) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 22px rgba(110,231,183,0.45)';
          }
        }}
        onMouseLeave={e => {
          if (isTmRunning) {
            e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
          } else if (canStart) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(110,231,183,0.3)';
          }
        }}
        onMouseDown={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        style={{
          width: 56,
          height: 56,
          minWidth: 56,
          borderRadius: '50%',
          border: isTmRunning ? '1px solid rgba(239,68,68,0.25)' : 'none',
          cursor: (!isTmRunning && !canStart) ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
          marginBottom: 4,
          ...(isTmRunning
            ? {
                background: 'rgba(239,68,68,0.15)',
                boxShadow: 'none',
              }
            : canStart
            ? {
                background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
                boxShadow: '0 4px 16px rgba(110,231,183,0.3)',
              }
            : {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: 0.4,
              }
          ),
        }}
      >
        {isTmRunning ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="5" width="5" height="14" rx="1.5" fill="#ef4444" />
            <rect x="14" y="5" width="5" height="14" rx="1.5" fill="#ef4444" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 4l13 8-13 8V4z" fill={canStart ? '#0f172a' : '#64748b'} />
          </svg>
        )}
      </button>
    </div>
  );
};
