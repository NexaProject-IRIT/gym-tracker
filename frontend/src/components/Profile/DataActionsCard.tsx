import React from 'react';

interface Props {
  exporting: boolean;
  clearing: boolean;
  onExport: () => void;
  onClearRequest: () => void;
}

export const DataActionsCard: React.FC<Props> = ({ exporting, clearing, onExport, onClearRequest }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
    <div style={{ color: 'var(--ghost)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
      Данные
    </div>

    <button onClick={onExport} disabled={exporting} style={{
      width: '100%', padding: '14px', borderRadius: 12, border: 'none',
      background: 'var(--accent-a10)', color: 'var(--accent)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'background 0.15s', opacity: exporting ? 0.6 : 1, marginBottom: 10,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {exporting ? 'Экспорт...' : 'Экспорт тренировок (.txt)'}
    </button>

    <button onClick={onClearRequest} disabled={clearing} style={{
      width: '100%', padding: '14px', borderRadius: 12, border: 'none',
      background: 'rgba(248,113,113,0.08)', color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'background 0.15s', opacity: clearing ? 0.6 : 1,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {clearing ? 'Очищаем...' : 'Очистить историю'}
    </button>
  </div>
);
