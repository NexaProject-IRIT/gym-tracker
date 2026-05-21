import React from 'react';

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export const NumberStepper: React.FC<Props> = ({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
  size = 'md',
}) => {
  const isFloat = step % 1 !== 0;
  const fmt = (n: number) => isFloat ? String(parseFloat(n.toFixed(1))) : String(Math.round(n));

  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = Math.max(min ?? 0, parseFloat(value || '0') - step);
    onChange(fmt(next));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = parseFloat(value || '0') + step;
    if (max !== undefined && next > max) return;
    onChange(fmt(next));
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
      {label && (
        <label style={{
          fontSize: size === 'sm' ? 10 : 11,
          color: size === 'sm' ? 'var(--faint)' : 'var(--dim)',
          display: 'block',
          marginBottom: size === 'sm' ? 4 : 5,
        }}>
          {label}
        </label>
      )}
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
          min={min ?? 0}
          max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
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
