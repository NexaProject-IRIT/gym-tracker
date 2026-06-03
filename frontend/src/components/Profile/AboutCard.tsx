import React, { useState } from 'react';

interface Member {
  name: string;
  role: string;
}

const TEAM: Member[] = [
  { name: 'Насибулин Данила', role: 'тимлид, фронтенд (тренировки, таймер), аналитика, AI-тренер' },
  { name: 'Жиляков Данил',    role: 'бэкенд (Django, API), DevOps и хостинг' },
  { name: 'Оглушевич Владислав', role: 'парсер базы знаний, синхронизация упражнений и изображений' },
  { name: 'Артемьева Дарья',  role: 'фронтенд (база тренировок, карточки упражнений)' },
  { name: 'Шмойлова Вероника', role: 'фронтенд (профиль, настройки, регистрация, лендинг)' },
];

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
};

const IconChevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const AboutCard: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text)', textAlign: 'left',
        }}
      >
        <img
          src="/nexa_logo.png" alt="Nexa"
          style={{
            width: 50, height: 50, borderRadius: 8, flexShrink: 0,
            background: 'var(--surface2)', objectFit: 'contain',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
            Команда Nexa
          </div>
          <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 2 }}>
            Студенты УрФУ · ИРИТ-РТФ
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'var(--faint)', fontSize: 12, fontWeight: 600,
        }}>
          {open ? 'Свернуть' : 'Подробнее'}
          <IconChevron open={open} />
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{
            color: 'var(--ghost)', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>
            Состав команды
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 18 }}>
            {TEAM.map(m => (
              <li key={m.name} style={{
                padding: '8px 0', borderBottom: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: 'var(--dim)', fontSize: 12, lineHeight: 1.4 }}>{m.role}</span>
              </li>
            ))}
          </ul>

          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{
              color: 'var(--ghost)', fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
            }}>
              Дисклеймер
            </div>
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: 12, lineHeight: 1.5 }}>
              GymLog — учебный проект. AI-тренер использует языковую модель и может ошибаться:
              его советы носят информационный характер и не являются медицинской рекомендацией.
              Не следуйте им как единственному источнику — при сомнениях, болях или травмах
              консультируйтесь с врачом или квалифицированным тренером. Команда Nexa не несёт
              ответственности за решения, принятые на основании ответов AI.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
