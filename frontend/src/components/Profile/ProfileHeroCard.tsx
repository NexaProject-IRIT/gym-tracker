import React, { useEffect, useState } from 'react';

interface Props {
  name: string;
  username: string;
  streak: number;
  totalLabel: string | null;
  thisMonth: number | null;
}

function computeInitials(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const ProfileHeroCard: React.FC<Props> = ({ name, username, streak, totalLabel, thisMonth }) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 480);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const initialsSource = name?.trim() || username || '';
  const initials = computeInitials(initialsSource);
  const displayName = name?.trim() || username || 'Ваш профиль';

  const avatarSize = isMobile ? 64 : 80;
  const avatarFontSize = isMobile ? 22 : 28;
  const nameSize = isMobile ? 18 : 22;
  const handleSize = isMobile ? 13 : 14;
  const badgeFontSize = isMobile ? 10.5 : 11;
  const cardPadding = isMobile ? '24px 20px 20px' : '30px 28px 26px';
  const idGap = isMobile ? 14 : 18;
  const idMarginBottom = isMobile ? 20 : 24;
  const tileValueSize = isMobile ? 22 : 24;
  const tileLabelSize = isMobile ? 11 : 12;
  const tilePadding = isMobile ? '14px 14px' : '16px 18px';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 560,
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 26,
      padding: cardPadding,
      overflow: 'hidden',
      boxShadow: '0 24px 60px -28px rgba(0,0,0,0.85)',
      margin: '0 auto',
    }}>
      {/* radial glow behind avatar */}
      <div style={{
        position: 'absolute',
        top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 340,
        background: 'radial-gradient(circle at 50% 50%, rgba(110,231,183,0.20), rgba(110,231,183,0.06) 38%, transparent 66%)',
        pointerEvents: 'none',
      }} />

      {/* identity */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: idGap,
        marginBottom: idMarginBottom,
      }}>
        <div style={{
          width: avatarSize, height: avatarSize, flexShrink: 0,
          borderRadius: '50%',
          background: 'linear-gradient(150deg, #252a34, #171a21)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: avatarFontSize, fontWeight: 600, color: 'var(--accent)',
          boxShadow: '0 0 0 2px var(--accent), 0 0 0 6px rgba(110,231,183,0.14), 0 0 24px -2px rgba(110,231,183,0.5)',
          letterSpacing: '0.02em',
          userSelect: 'none',
        }}>
          {initials}
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 3,
          minWidth: 0, flex: 1,
        }}>
          <span style={{
            fontSize: nameSize, fontWeight: 700, letterSpacing: '-0.015em',
            lineHeight: 1.2,
            color: 'var(--text)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}>
            {displayName}
          </span>
          <span style={{
            fontSize: handleSize,
            color: 'var(--ghost)',
            fontWeight: 500,
            wordBreak: 'break-all',
          }}>
            @{username}
          </span>
          {streak > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 6,
              alignSelf: 'flex-start',
              background: 'var(--accent-a12)',
              color: 'var(--accent)',
              fontSize: badgeFontSize, fontWeight: 600, letterSpacing: '0.02em',
              padding: '4px 9px', borderRadius: 999,
              whiteSpace: 'nowrap',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)',
              }} />
              {streak}-недельная серия
            </span>
          )}
        </div>
      </div>

      {/* stat tiles */}
      <div style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        <Tile value={totalLabel} label="Тренировки" valueSize={tileValueSize} labelSize={tileLabelSize} padding={tilePadding} />
        <Tile value={thisMonth != null ? String(thisMonth) : null} label="Этот месяц" valueSize={tileValueSize} labelSize={tileLabelSize} padding={tilePadding} />
      </div>
    </div>
  );
};

const Tile: React.FC<{ value: string | null; label: string; valueSize: number; labelSize: number; padding: string }> = ({
  value, label, valueSize, labelSize, padding,
}) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding,
    display: 'flex', flexDirection: 'column', gap: 6,
    minWidth: 0,
  }}>
    <span style={{
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: valueSize, fontWeight: 700,
      color: 'var(--accent)',
      letterSpacing: '-0.01em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {value ?? '—'}
    </span>
    <span style={{
      fontSize: labelSize, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--ghost)', fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}>
      {label}
    </span>
  </div>
);
