import React from 'react';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({ message, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  }}>
    <div style={{
      background: 'var(--surface)', borderRadius: 20,
      border: '1px solid var(--border2)',
      padding: 28, maxWidth: 360, width: '100%',
    }}>
      <p style={{ color: 'var(--text)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px', borderRadius: 12,
          border: '1px solid var(--border2)', background: 'transparent',
          color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Отмена</button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: '12px', borderRadius: 12, border: 'none',
          background: 'rgba(248,113,113,0.15)',
          color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>Удалить</button>
      </div>
    </div>
  </div>
);
