import React from 'react';

const btnS: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
  background: 'var(--border2)', color: 'var(--muted)', fontSize: 18, fontWeight: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  transition: 'background 0.1s',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const TimeField: React.FC<Props> = ({ value, onChange }) => {
  const [unit, setUnit] = React.useState<'sec' | 'min'>('sec');
  const num = parseInt(value || '0');
  const displayVal = unit === 'min' ? Math.round(num / 60) : num;
  const dec = (e: React.MouseEvent) => {
    e.preventDefault();
    const nd = Math.max(0, displayVal - 1);
    onChange(String(unit === 'min' ? nd * 60 : nd));
  };
  const inc = (e: React.MouseEvent) => {
    e.preventDefault();
    const nd = displayVal + 1;
    onChange(String(unit === 'min' ? nd * 60 : nd));
  };
  const handleChange = (raw: string) => {
    const n = parseInt(raw) || 0;
    onChange(unit === 'min' ? String(n * 60) : String(n));
  };
  const switchUnit = (e: React.MouseEvent, u: 'sec' | 'min') => {
    e.preventDefault();
    setUnit(u);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 11, color: 'var(--dim)' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{
              padding: '2px 8px', fontSize: 11, border: 'none', cursor: 'pointer', fontWeight: 500,
              background: unit === u ? 'var(--accent-a20)' : 'transparent',
              color: unit === u ? 'var(--accent)' : 'var(--faint)',
            }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', padding: '4px 6px' }}>
        <button style={btnS} onClick={dec}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--border2)')}
        >−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
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
