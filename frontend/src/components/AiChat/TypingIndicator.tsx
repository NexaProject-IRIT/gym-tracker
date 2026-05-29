export const TypingIndicator = () => (
  <>
    <style>{`
      @keyframes ai-typing-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
      .ai-typing-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--accent);
        animation: ai-typing-dot 1.2s infinite ease-in-out;
      }
      .ai-typing-dot:nth-child(2) { animation-delay: 0.15s; }
      .ai-typing-dot:nth-child(3) { animation-delay: 0.3s; }
    `}</style>

    <div style={{
      width: '100%',
      marginBottom: 14,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '2.5px solid var(--accent)',
      borderRadius: '6px 16px 16px 16px',
      padding: '13px 15px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 7,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        color: 'var(--accent)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.8 5.6a4 4 0 0 0 2.6 2.6L22 12l-5.6 1.8a4 4 0 0 0-2.6 2.6L12 22l-1.8-5.6a4 4 0 0 0-2.6-2.6L2 12l5.6-1.8a4 4 0 0 0 2.6-2.6L12 2z"/>
        </svg>
        ИИ-тренер
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', minHeight: 22 }}>
        <div className="ai-typing-dot" />
        <div className="ai-typing-dot" />
        <div className="ai-typing-dot" />
      </div>
    </div>
  </>
);
