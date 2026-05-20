import React from 'react';

const btnS: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
  background: 'var(--border2)', color: 'var(--muted)', fontSize: 16, fontWeight: 300,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  transition: 'background 0.1s',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const TimeField: React.FC<Props> = ({ value, onChange }) => {
  const [unit, setUnit] = React.useState<'sec' | 'min'>('sec');
  const storedSec = parseInt(value || '0');
  const displayVal = unit === 'min' ? Math.round(storedSec / 60) : storedSec;
  const dec = (e: React.MouseEvent) => { e.preventDefault(); const n = Math.max(0, displayVal - 1); onChange(String(unit === 'min' ? n * 60 : n)); };
  const inc = (e: React.MouseEvent) => { e.preventDefault(); const n = displayVal + 1; onChange(String(unit === 'min' ? n * 60 : n)); };
  const handleChange = (raw: string) => { const n = parseInt(raw) || 0; onChange(String(unit === 'min' ? n * 60 : n)); };
  const switchUnit = (e: React.MouseEvent, u: 'sec' | 'min') => { e.preventDefault(); setUnit(u); };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 10, color: 'var(--faint)' }}>Время</label>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['sec', 'min'] as const).map(u => (
            <button key={u} onClick={(e) => switchUnit(e, u)} style={{
              padding: '2px 7px', fontSize: 10, border: 'none', cursor: 'pointer', fontWeight: 500,
              background: unit === u ? 'var(--accent-a20)' : 'transparent',
              color: unit === u ? 'var(--accent)' : 'var(--faint)',
            }}>{u === 'sec' ? 'сек' : 'мин'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', padding: '3px 4px' }}>
        <button style={btnS} onClick={dec}>−</button>
        <input type="number" min="0" value={displayVal || ''} onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: 'none', fontSize: 13, outline: 'none', textAlign: 'center', minWidth: 0 } as React.CSSProperties}
        />
        <button style={btnS} onClick={inc}>+</button>
      </div>
    </div>
  );
};
