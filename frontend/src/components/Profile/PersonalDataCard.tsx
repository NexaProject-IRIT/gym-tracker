import React from 'react';
import { NumberStepper } from '../UI/NumberStepper';

export type Goal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'recomposition'
  | 'improve_endurance'
  | 'increase_strength'
  | 'maintain';

// eslint-disable-next-line react-refresh/only-export-components
export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'Похудение',
  gain_muscle: 'Набор мышц',
  recomposition: 'Рекомпозиция',
  improve_endurance: 'Выносливость',
  increase_strength: 'Сила',
  maintain: 'Поддержание формы',
};

const GOAL_OPTIONS = Object.entries(GOAL_LABELS) as [Goal, string][];

export interface ProfileData {
  username: string;
  displayName: string;
  age: string;
  weight: string;
  height: string;
  goal: Goal | '';
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 0', borderBottom: '1px solid var(--border)',
};

type NumericField = 'age' | 'weight' | 'height';
const numericFields: { field: NumericField; label: string; step: number; min: number; max: number }[] = [
  { field: 'age',    label: 'Возраст',   step: 1,   min: 10, max: 120 },
  { field: 'weight', label: 'Вес (кг)',  step: 0.5, min: 20, max: 500 },
  { field: 'height', label: 'Рост (см)', step: 1,   min: 50, max: 280 },
];

interface Props {
  profile: ProfileData;
  draft: ProfileData;
  isEditing: boolean;
  saving: boolean;
  saveError: string | null;
  usernameError: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDraftChange: (draft: ProfileData) => void;
}

export const PersonalDataCard: React.FC<Props> = ({
  profile, draft, isEditing, saving, saveError, usernameError,
  onEdit, onSave, onCancel, onDraftChange,
}) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div style={{ color: 'var(--ghost)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Личные данные
      </div>
      {!isEditing ? (
        <button onClick={onEdit} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20, border: 'none',
          background: 'var(--accent-a10)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Редактировать
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border2)',
            background: 'transparent', color: 'var(--dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Отмена</button>
          <button onClick={onSave} disabled={saving} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: 'var(--accent-fg)', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1,
          }}>{saving ? 'Сохраняем...' : 'Сохранить'}</button>
        </div>
      )}
    </div>

    {saveError && (
      <div style={{
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
        borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 12,
      }}>
        {saveError}
      </div>
    )}

    <div style={rowStyle}>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Логин</span>
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <input type="text" value={draft.username} onChange={e => onDraftChange({ ...draft, username: e.target.value })}
            placeholder="Логин" style={{
              background: 'var(--surface2)', color: 'var(--text)',
              border: `1px solid ${usernameError ? 'rgba(248,113,113,0.5)' : 'var(--border2)'}`,
              borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 150, textAlign: 'right',
            }}
          />
          {usernameError && <span style={{ fontSize: 11, color: '#f87171' }}>{usernameError}</span>}
        </div>
      ) : (
        <span style={{ color: 'var(--text)', fontSize: 14 }}>@{profile.username}</span>
      )}
    </div>

    <div style={rowStyle}>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Отображаемое имя</span>
      {isEditing ? (
        <input type="text" value={draft.displayName} onChange={e => onDraftChange({ ...draft, displayName: e.target.value })}
          placeholder="Как вас называть" style={{
            background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)',
            borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 150, textAlign: 'right',
          }}
        />
      ) : (
        <span style={{ color: profile.displayName !== profile.username ? 'var(--text)' : 'var(--ghost)', fontSize: 14 }}>
          {profile.displayName !== profile.username ? profile.displayName : '— не задано'}
        </span>
      )}
    </div>

    {numericFields.map(({ field, label, step, min, max }) => (
      <div key={field} style={rowStyle}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>{label}</span>
        {isEditing ? (
          <div style={{ width: 170 }}>
            <NumberStepper value={draft[field]} onChange={v => onDraftChange({ ...draft, [field]: v })} step={step} min={min} max={max} />
          </div>
        ) : (
          <span style={{ color: profile[field] ? 'var(--text)' : 'var(--ghost)', fontSize: 14 }}>{profile[field] || '— не указано'}</span>
        )}
      </div>
    ))}

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
      <span style={{ color: 'var(--muted)', fontSize: 14 }}>Цель</span>
      {isEditing ? (
        <select value={draft.goal} onChange={e => onDraftChange({ ...draft, goal: e.target.value as Goal })}
          style={{
            background: 'var(--surface2)', color: draft.goal ? 'var(--text)' : 'var(--faint)',
            border: '1px solid var(--border2)',
            borderRadius: 8, padding: '6px 10px', fontSize: 14, outline: 'none', width: 180, cursor: 'pointer',
          }}
        >
          <option value="">— не указано</option>
          {GOAL_OPTIONS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      ) : (
        <span style={{ color: profile.goal ? 'var(--text)' : 'var(--ghost)', fontSize: 14 }}>
          {profile.goal ? GOAL_LABELS[profile.goal] : '— не указано'}
        </span>
      )}
    </div>
  </div>
);
