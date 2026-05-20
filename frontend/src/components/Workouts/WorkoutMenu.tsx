import React from 'react';

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconRepeat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M17 1l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 11V9a4 4 0 014-4h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 23l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Props {
  onEdit: () => void;
  onRepeat: () => void;
  onDelete: () => void;
}

export const WorkoutMenu: React.FC<Props> = ({ onEdit, onRepeat, onDelete }) => {
  const items = [
    { icon: <IconEdit />, label: 'Открыть', action: onEdit, color: 'var(--muted)' },
    { icon: <IconRepeat />, label: 'Повторить', action: onRepeat, color: 'var(--muted)' },
    { icon: <IconTrash />, label: 'Удалить', action: onDelete, color: '#f87171' },
  ];

  return (
    <div style={{
      position: 'absolute', right: 0, top: 40, width: 180, zIndex: 10,
      background: 'var(--surface2)', borderRadius: 14, overflow: 'hidden',
      border: '1px solid var(--border2)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', background: 'var(--surface2)', border: 'none', cursor: 'pointer',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            color: item.color, fontSize: 13, fontWeight: 500,
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
};
