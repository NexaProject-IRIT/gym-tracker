import React from 'react';

interface NumberInputProps {
  value: string;
  onChange: (v: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
}) => {
  const isFloat = step % 1 !== 0;
  const fmt = (n: number) =>
    isFloat ? String(parseFloat(n.toFixed(1))) : String(Math.round(n));

  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    const cur = parseFloat(value || '0');
    const next = cur - step;
    if (min !== undefined && next < min) return;
    onChange(fmt(next));
  };

  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    const cur = parseFloat(value || '0');
    const next = cur + step;
    if (max !== undefined && next > max) return;
    onChange(fmt(next));
  };

  const btnStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.07)',
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.1s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#21252e',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '4px 6px',
      }}
    >
      <button
        style={btnStyle}
        onClick={dec}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          color: '#f1f5f9',
          border: 'none',
          fontSize: 14,
          outline: 'none',
          textAlign: 'center',
          minWidth: 0,
        } as React.CSSProperties}
      />
      <button
        style={btnStyle}
        onClick={inc}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      >
        +
      </button>
    </div>
  );
};
