import React from 'react';

const btnS: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
  background: 'var(--border2)', color: 'var(--muted)', fontSize: 16, fontWeight: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  transition: 'background 0.1s',
};

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}

export const SmallField: React.FC<Props> = ({ label, value, onChange, step }) => {
  const stepNum = parseFloat(step ?? '1') || 1;
  const isInt = !step || step === '1';
  const fmt = (n: number) => isInt ? String(Math.round(n)) : String(parseFloat(n.toFixed(1)));
  const dec = () => onChange(fmt(Math.max(0, parseFloat(value || '0') - stepNum)));
  const inc = () => onChange(fmt(parseFloat(value || '0') + stepNum));
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--faint)', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', padding: '3px 4px' }}>
        <button style={btnS} onClick={e => { e.preventDefault(); dec(); }}>−</button>
        <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={e => { e.preventDefault(); inc(); }}>+</button>
      </div>
    </div>
  );
};
