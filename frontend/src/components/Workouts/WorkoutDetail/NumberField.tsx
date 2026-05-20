import React from 'react';

const btnS: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
  background: 'var(--border2)', color: 'var(--muted)', fontSize: 18, fontWeight: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  transition: 'background 0.1s',
};

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}

export const NumberField: React.FC<Props> = ({ label, value, onChange, step }) => {
  const stepNum = parseFloat(step ?? '1') || 1;
  const isInt = !step || step === '1';
  const fmt = (n: number) => isInt ? String(Math.round(n)) : String(parseFloat(n.toFixed(1)));
  const dec = (e: React.MouseEvent) => { e.preventDefault(); onChange(fmt(Math.max(0, parseFloat(value || '0') - stepNum))); };
  const inc = (e: React.MouseEvent) => { e.preventDefault(); onChange(fmt(parseFloat(value || '0') + stepNum)); };
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--dim)', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 14,
            outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >+</button>
      </div>
    </div>
  );
};
