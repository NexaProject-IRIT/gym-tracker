import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import React from 'react';

type Step = 'account' | 'body';

interface AccountForm {
  login: string;
  password: string;
  confirmPassword: string;
}

interface BodyForm {
  height: string;
  weight: string;
}

interface AccountErrors {
  login?: string;
  password?: string;
  confirmPassword?: string;
}

interface BodyErrors {
  height?: string;
  weight?: string;
  api?: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('account');

  const [account, setAccount] = useState<AccountForm>({ login: '', password: '', confirmPassword: '' });
  const [body, setBody] = useState<BodyForm>({ height: '', weight: '' });
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [bodyErrors, setBodyErrors] = useState<BodyErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateAccount = (): boolean => {
    const e: AccountErrors = {};
    if (!account.login.trim()) e.login = 'Введите логин';
    else if (account.login.length < 3) e.login = 'Минимум 3 символа';
    if (!account.password) e.password = 'Введите пароль';
    else if (account.password.length < 8) e.password = 'Минимум 8 символов';
    if (!account.confirmPassword) e.confirmPassword = 'Повторите пароль';
    else if (account.password !== account.confirmPassword) e.confirmPassword = 'Пароли не совпадают';
    setAccountErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBody = (): boolean => {
    const e: BodyErrors = {};
    const h = parseFloat(body.height);
    const w = parseFloat(body.weight);
    if (!body.height) e.height = 'Введите рост';
    else if (isNaN(h) || h <= 0) e.height = 'Некорректное значение';
    else if (h < 50 || h > 280) e.height = 'Рост от 50 до 280 см';
    if (!body.weight) e.weight = 'Введите вес';
    else if (isNaN(w) || w <= 0) e.weight = 'Некорректное значение';
    else if (w < 20 || w > 500) e.weight = 'Вес от 20 до 500 кг';
    setBodyErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => {
    if (validateAccount()) setStep('body');
  };

  const handleSubmit = async () => {
    if (!validateBody()) return;
    setLoading(true);
    setBodyErrors({});
    try {
      const res = await fetch('http://localhost:8000/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: account.login,
          password: account.password,
          password2: account.confirmPassword,
          height: parseFloat(body.height),
          weight: parseFloat(body.weight),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.username?.[0] || data.password?.[0] || data.detail || 'Ошибка регистрации';
        setBodyErrors({ api: msg });
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch {
      setBodyErrors({ api: 'Нет связи с сервером' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#111318',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(110,231,183,0.12)',
            border: '1px solid rgba(110,231,183,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>GymLog</h1>
          <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Создайте аккаунт</p>
        </div>

        {/* Индикатор шагов */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {(['account', 'body'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: step === s || (s === 'account' && step === 'body')
                    ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${step === s || (s === 'account' && step === 'body')
                    ? '#6ee7b7' : 'rgba(255,255,255,0.1)'}`,
                  color: step === s || (s === 'account' && step === 'body') ? '#6ee7b7' : '#475569',
                }}>
                  {s === 'account' && step === 'body' ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: step === s ? '#f1f5f9' : '#475569',
                }}>
                  {s === 'account' ? 'Аккаунт' : 'Параметры'}
                </span>
              </div>
              {i === 0 && (
                <div style={{
                  height: 1, flex: 1,
                  background: step === 'body' ? 'rgba(110,231,183,0.4)' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Форма */}
        <div style={{
          background: '#1a1d24', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '28px',
        }}>

          {/* Шаг 1: Аккаунт */}
          {step === 'account' && (
            <>
              <Field
                label="Логин"
                value={account.login}
                onChange={v => setAccount(f => ({ ...f, login: v }))}
                error={accountErrors.login}
                placeholder="Придумайте логин"
              />
              <Field
                label="Пароль"
                value={account.password}
                onChange={v => setAccount(f => ({ ...f, password: v }))}
                error={accountErrors.password}
                placeholder="Минимум 6 символов"
                type={showPassword ? 'text' : 'password'}
                rightEl={
                  <button onClick={() => setShowPassword(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, fontSize: 16 }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                }
              />
              <Field
                label="Повтор пароля"
                value={account.confirmPassword}
                onChange={v => setAccount(f => ({ ...f, confirmPassword: v }))}
                error={accountErrors.confirmPassword}
                placeholder="Повторите пароль"
                type={showConfirm ? 'text' : 'password'}
                rightEl={
                  <button onClick={() => setShowConfirm(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, fontSize: 16 }}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                }
              />
              <button
                onClick={handleNextStep}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
                  color: '#052e16', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  marginTop: 8, transition: 'opacity 0.15s',
                }}
              >
                Далее →
              </button>
            </>
          )}

          {/* Шаг 2: Параметры тела */}
          {step === 'body' && (
            <>
              <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
                Эти данные помогут отслеживать прогресс и давать точные рекомендации.
              </p>

              <Field
                label="Рост (см)"
                value={body.height}
                onChange={v => setBody(f => ({ ...f, height: v }))}
                error={bodyErrors.height}
                placeholder="Например: 175"
                type="number"
              />
              <Field
                label="Начальный вес (кг)"
                value={body.weight}
                onChange={v => setBody(f => ({ ...f, weight: v }))}
                error={bodyErrors.weight}
                placeholder="Например: 75"
                type="number"
              />

              {bodyErrors.api && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                  color: '#f87171', fontSize: 13,
                }}>
                  {bodyErrors.api}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setStep('account')}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  ← Назад
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                    background: loading ? 'rgba(110,231,183,0.4)' : 'linear-gradient(135deg, #6ee7b7, #34d399)',
                    color: '#052e16', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {loading ? 'Создаём...' : 'Создать аккаунт'}
                </button>
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#475569' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: '#6ee7b7', textDecoration: 'none', fontWeight: 600 }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label, value, onChange, error, placeholder, type = 'text', rightEl
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  rightEl?: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 500, display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#21252e', color: '#f1f5f9',
          borderRadius: 10, padding: rightEl ? '10px 40px 10px 14px' : '10px 14px',
          border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
          fontSize: 14, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = error ? 'rgba(248,113,113,0.7)' : 'rgba(110,231,183,0.4)')}
        onBlur={e => (e.target.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)')}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
    {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{error}</p>}
  </div>
);