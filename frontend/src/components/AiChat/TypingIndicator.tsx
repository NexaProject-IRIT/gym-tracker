export const TypingIndicator = () => (
  <>
    <style>{`
      @keyframes gymbot-dot {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
      .gymbot-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #6ee7b7;
        animation: gymbot-dot 1.2s infinite ease-in-out;
      }
      .gymbot-dot:nth-child(2) { animation-delay: 0.15s; }
      .gymbot-dot:nth-child(3) { animation-delay: 0.3s; }
    `}</style>

    <div style={{
      display: 'flex',
      gap: 10,
      marginBottom: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: 'rgba(110,231,183,0.12)',
        border: '1px solid rgba(110,231,183,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
            stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div style={{
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        borderRadius: '4px 16px 16px 16px',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
      }}>
        <div className="gymbot-dot" />
        <div className="gymbot-dot" />
        <div className="gymbot-dot" />
      </div>
    </div>
  </>
);