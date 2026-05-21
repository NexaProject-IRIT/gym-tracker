import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const IconSun = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const IconMoon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const OPTIONS = [
  { value: 'light', label: 'Светлая', icon: <IconSun /> },
  { value: 'dark', label: 'Тёмная',  icon: <IconMoon /> },
] as const;

export const ThemeSettingsCard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{
          color: 'var(--ghost)', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Внешний вид
        </div>
        <div style={{ fontSize: 12, color: 'var(--faint)' }}>
          тема приложения
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Тема приложения"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {OPTIONS.map(opt => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              onClick={() => { if (!active) toggleTheme(); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 12px',
                borderRadius: 9,
                border: 'none',
                cursor: active ? 'default' : 'pointer',
                background: active ? 'var(--bg)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
                letterSpacing: '-0.005em',
                boxShadow: active
                  ? '0 2px 6px rgba(0,0,0,0.10), inset 0 0 0 1px var(--border2)'
                  : 'none',
                transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.color = 'var(--text3)';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.color = 'var(--muted)';
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
