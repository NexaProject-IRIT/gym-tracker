import React from 'react';

interface Props {
  onAdd: () => void;
}

export const WorkoutEmptyState: React.FC<Props> = ({ onAdd }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '32px 36px 60px',
  }}>
    <style>{`
      @keyframes wempty-float {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-5px); }
      }
      .wempty-bar { transform-origin: center; animation: wempty-float 4.5s ease-in-out infinite; }
      .wempty-cta { transition: transform .12s ease, background .2s ease; }
      .wempty-cta:hover  { background: #86eec5; }
      .wempty-cta:active { transform: scale(0.97); }
    `}</style>

    <div style={{
      position: 'relative',
      width: 148, height: 148,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 30,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 50% 50%, var(--accent-a12), transparent 68%)',
      }} />
      <div style={{
        position: 'absolute', inset: 14,
        borderRadius: '50%',
        border: '1px dashed var(--border2)',
      }} />
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" style={{ position: 'relative' }}>
        <g className="wempty-bar" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round">
          <line x1="30" y1="48" x2="66" y2="48" />
          <rect x="22" y="34" width="8"  height="28" rx="3" />
          <rect x="14" y="40" width="7"  height="16" rx="3" />
          <rect x="66" y="34" width="8"  height="28" rx="3" />
          <rect x="75" y="40" width="7"  height="16" rx="3" />
        </g>
      </svg>
    </div>

    <h2 style={{
      margin: 0,
      fontSize: 23, fontWeight: 700,
      letterSpacing: '-0.01em',
      color: 'var(--text)',
      marginBottom: 8,
    }}>
      Нет тренировок
    </h2>
    <p style={{
      margin: 0,
      fontSize: 15, color: 'var(--muted)',
      lineHeight: 1.45,
      maxWidth: 230,
      marginBottom: 30,
    }}>
      Добавь первую и начни вести историю своих занятий.
    </p>

    <button
      onClick={onAdd}
      className="wempty-cta"
      style={{
        border: 'none', cursor: 'pointer',
        background: 'var(--accent)',
        color: 'var(--accent-fg)',
        fontSize: 16, fontWeight: 700,
        letterSpacing: '0.01em',
        borderRadius: 16,
        padding: '16px 28px',
        display: 'inline-flex', alignItems: 'center', gap: 10,
        boxShadow: '0 12px 26px -12px rgba(110,231,183,0.65)',
      }}
    >
      <span style={{ position: 'relative', width: 14, height: 14, display: 'inline-block' }}>
        <span style={{ position: 'absolute', left: 6, top: 0, width: 2, height: 14, background: 'currentColor', borderRadius: 2 }} />
        <span style={{ position: 'absolute', top: 6, left: 0, height: 2, width: 14, background: 'currentColor', borderRadius: 2 }} />
      </span>
      Добавить тренировку
    </button>

    <div style={{
      marginTop: 18,
      fontSize: 12, color: 'var(--faint)',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      letterSpacing: '0.02em',
    }}>
      или импортируй из шаблона
    </div>
  </div>
);
