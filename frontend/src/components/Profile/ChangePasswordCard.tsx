import React, { useState } from 'react';
import { apiFetch, ApiError } from '../../lib/api';

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const MIN_PASSWORD_LENGTH = 6;

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 6,
};

const inputBase: React.CSSProperties = {
  width: '100%', background: 'var(--surface2)', color: 'var(--text)',
  borderRadius: 10, padding: '10px 40px 10px 14px',
  border: '1px solid var(--border)',
  fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

export const ChangePasswordCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [oldError, setOldError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);

  const reset = () => {
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    setShowOld(false); setShowNew(false); setShowConfirm(false);
    setError(null); setOldError(null); setNewError(null); setSuccess(false);
  };

  const closeForm = () => { reset(); setOpen(false); };

  const newPwdIssue: string | null = (() => {
    if (!newPwd) return null;
    if (newPwd.length < MIN_PASSWORD_LENGTH) return `Минимум ${MIN_PASSWORD_LENGTH} символов`;
    if (/^\d+$/.test(newPwd)) return 'Пароль не может состоять только из цифр';
    return null;
  })();

  const confirmIssue: string | null = (() => {
    if (!confirmPwd) return null;
    if (newPwd !== confirmPwd) return 'Пароли не совпадают';
    return null;
  })();

  const canSubmit =
    oldPwd.length > 0 &&
    newPwd.length >= MIN_PASSWORD_LENGTH &&
    !newPwdIssue &&
    confirmPwd === newPwd;

  const handleSubmit = async () => {
    setError(null); setOldError(null); setNewError(null);
    setSaving(true);
    try {
      await apiFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPwd, new_password: newPwd }),
      });
      setSuccess(true);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => { closeForm(); }, 1500);
    } catch (e) {
      if (e instanceof ApiError) {
        const data = e.data as Record<string, unknown> | undefined;
        const oldErr = (data?.old_password as string[] | undefined)?.[0];
        const newErr = (data?.new_password as string[] | undefined)?.[0];
        if (oldErr) setOldError(oldErr);
        if (newErr) setNewError(newErr);
        if (!oldErr && !newErr) setError(e.message);
      } else {
        setError('Нет связи с сервером');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'var(--ghost)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Безопасность
            </div>
            <div style={{ color: 'var(--text)', fontSize: 14 }}>Пароль для входа</div>
          </div>
          <button onClick={() => setOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20, border: 'none',
            background: 'var(--accent-a10)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Сменить пароль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: 'var(--ghost)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Смена пароля
        </div>
        <button onClick={closeForm} style={{
          padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border2)',
          background: 'transparent', color: 'var(--dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Отмена</button>
      </div>

      {success && (
        <div style={{
          background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: 'var(--accent2)', fontSize: 12,
        }}>
          Пароль успешно изменён
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: '#f87171', fontSize: 12,
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Текущий пароль</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showOld ? 'text' : 'password'}
            value={oldPwd}
            onChange={e => { setOldPwd(e.target.value); setOldError(null); }}
            placeholder="Введите текущий пароль"
            style={{
              ...inputBase,
              border: `1px solid ${oldError ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
            }}
          />
          <button onClick={() => setShowOld(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0,
          }}>
            {showOld ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {oldError && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{oldError}</p>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Новый пароль</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPwd}
            onChange={e => { setNewPwd(e.target.value); setNewError(null); }}
            placeholder={`Минимум ${MIN_PASSWORD_LENGTH} символов`}
            style={{
              ...inputBase,
              border: `1px solid ${newPwdIssue || newError ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
            }}
          />
          <button onClick={() => setShowNew(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0,
          }}>
            {showNew ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {(newError || newPwdIssue) && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{newError || newPwdIssue}</p>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Повтор нового пароля</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="Повторите новый пароль"
            style={{
              ...inputBase,
              border: `1px solid ${confirmIssue ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
            }}
          />
          <button onClick={() => setShowConfirm(s => !s)} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0,
          }}>
            {showConfirm ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {confirmIssue && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{confirmIssue}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, border: 'none',
          background: canSubmit && !saving
            ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
            : 'var(--border)',
          color: canSubmit && !saving ? 'var(--accent-fg)' : 'var(--faint)',
          fontWeight: 700, fontSize: 14,
          cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}>
        {saving ? 'Сохраняем...' : 'Сохранить новый пароль'}
      </button>
    </div>
  );
};
