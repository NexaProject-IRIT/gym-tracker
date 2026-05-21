import React from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  size?: 'sm' | 'md';
}

export const TimeStepper: React.FC<Props> = ({ value, onChange, size = 'md' }) => {
  const [unit, setUnit] = React.useState<'sec' | 'min'>('sec');
  const storedSec = parseInt(value || '0');
  const displayVal = unit === 'min' ? Math.round(storedSec / 60) : storedSec;

  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    const n = Math.max(0, displayVal - 1);
    onChange(String(unit === 'min' ? n * 60 : n));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    const n = displayVal + 1;
    onChange(String(unit === 'min' ? n * 60 : n));
  };
  const handleChange = (raw: string) => {
    const n = parseInt(raw) || 0;
    onChange(String(unit === 'min' ? n * 60 : n));
  };
  const switchUnit = (e: React.MouseEvent, u: 'sec' | 'min') => {
    e.preventDefault();
    setUnit(u);
  };

  const btnSize = size === 'sm' ? 28 : 34;
  const btnRadius = size === 'sm' ? 7 : 9;
  const btnFontSize = size === 'sm' ? 16 : 18;
  const wrapRadius = size === 'sm' ? 8 : 10;
  const wrapPadding = size === 'sm' ? '3px 4px' : '4px 6px';
  const wrapGap = size === 'sm' ? 4 : 6;

  const btnStyle: React.CSSProperties = {
    width: btnSize, height: btnSize, borderRadius: btnRadius, border: 'none', cursor: 'pointer',
    background: 'var(--border2)', color: 'var(--muted)', fontSize: btnFontSize, fontWeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'background 0.1s',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: size === 'sm' ? 4 : 5 }}>
        <label style={{ fontSize: size === 'sm' ? 10 : 11, color: size === 'sm' ? 'var(--faint)' : 'var(--dim)' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={e => switchUnit(e, u)} style={{
              padding: size === 'sm' ? '2px 7px' : '2px 8px',
              fontSize: size === 'sm' ? 10 : 11,
              border: 'none', cursor: 'pointer', fontWeight: 500,
              background: unit === u ? 'var(--accent-a20)' : 'transparent',
              color: unit === u ? 'var(--accent)' : 'var(--faint)',
            }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: wrapGap,
        background: 'var(--surface2)', borderRadius: wrapRadius,
        border: '1px solid var(--border)', padding: wrapPadding,
      }}>
        <button style={btnStyle} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >−</button>
        <input
          type="number"
          min="0"
          value={displayVal || ''}
          onChange={e => handleChange(e.target.value)}
          style={{
            flex: 1, background: 'transparent', color: 'var(--text)', border: 'none',
            fontSize: size === 'sm' ? 13 : 14, outline: 'none', textAlign: 'center', minWidth: 0,
          } as React.CSSProperties}
        />
        <button style={btnStyle} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >+</button>
      </div>
    </div>
  );
};
