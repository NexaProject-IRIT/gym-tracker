import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import React from 'react';
import { NumberInput } from '../components/UI/NumberInput';
import { setTokens } from '../utils/api';

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

type Step = 'account' | 'body';

type Goal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'recomposition'
  | 'improve_endurance'
  | 'increase_strength'
  | 'maintain';

const GOAL_OPTIONS: { value: Goal; label: string; icon: React.ReactNode }[] = [
  { value: 'lose_weight', label: 'Похудение', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 8v4l3 3"/>
    </svg>
  )},
  { value: 'gain_muscle', label: 'Набор мышц', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"/>
    </svg>
  )},
  { value: 'recomposition', label: 'Рекомпозиция', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/>
    </svg>
  )},
  { value: 'improve_endurance', label: 'Выносливость', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  )},
  { value: 'increase_strength', label: 'Сила', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  )},
  { value: 'maintain', label: 'Поддержание формы', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )},
];

interface AccountForm {
  login: string;
  password: string;
  confirmPassword: string;
}

interface BodyForm {
  height: string;
  weight: string;
  age: string;
  goal: Goal | '';
}

interface AccountErrors {
  login?: string;
  password?: string;
  confirmPassword?: string;
}

interface BodyErrors {
  height?: string;
  weight?: string;
  age?: string;
  goal?: string;
  api?: string;
}

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('account');

  const [account, setAccount] = useState<AccountForm>({ login: '', password: '', confirmPassword: '' });
  const [body, setBody] = useState<BodyForm>({ height: '', weight: '', age: '', goal: '' });
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
    else if (account.password.length < 10) e.password = 'Минимум 10 символов';
    else if (!/\d/.test(account.password)) e.password = 'Пароль должен содержать хотя бы одну цифру';
    if (!account.confirmPassword) e.confirmPassword = 'Повторите пароль';
    else if (account.password !== account.confirmPassword) e.confirmPassword = 'Пароли не совпадают';
    setAccountErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBody = (): boolean => {
    const e: BodyErrors = {};
    const h = parseFloat(body.height);
    const w = parseFloat(body.weight);
    const a = parseInt(body.age);
    if (!body.height) e.height = 'Введите рост';
    else if (isNaN(h) || h <= 0) e.height = 'Некорректное значение';
    else if (h < 50 || h > 280) e.height = 'Рост от 50 до 280 см';
    if (!body.weight) e.weight = 'Введите вес';
    else if (isNaN(w) || w <= 0) e.weight = 'Некорректное значение';
    else if (w < 20 || w > 500) e.weight = 'Вес от 20 до 500 кг';
    if (body.age && (isNaN(a) || a < 10 || a > 120)) e.age = 'Возраст от 10 до 120 лет';
    setBodyErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep = () => { if (validateAccount()) setStep('body'); };

  const handleSubmit = async () => {
    if (!validateBody()) return;
    setLoading(true);
    setBodyErrors({});
    try {
      const res = await fetch('/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: account.login,
          password: account.password,
          password2: account.confirmPassword,
          height: parseFloat(body.height),
          weight: parseFloat(body.weight),
          age: body.age ? parseInt(body.age) : null,
          goal: body.goal || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.username?.[0]) {
          setAccountErrors({ login: data.username[0] });
          setStep('account');
          return;
        }
        const msg = data.password?.[0] || data.detail || 'Ошибка регистрации';
        setBodyErrors({ api: msg });
        return;
      }
      setTokens(data.access, data.refresh);
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
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-a12)', border: '1px solid var(--accent-a20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ color: 'var(--text)', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>GymLog</h1>
          <p style={{ color: 'var(--faint)', fontSize: 14, margin: 0 }}>Создайте аккаунт</p>
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
                    ? 'var(--accent-a20)' : 'var(--border)',
                  border: `1.5px solid ${step === s || (s === 'account' && step === 'body') ? 'var(--accent)' : 'var(--border2)'}`,
                  color: step === s || (s === 'account' && step === 'body') ? 'var(--accent)' : 'var(--faint)',
                }}>
                  {s === 'account' && step === 'body' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: step === s ? 'var(--text)' : 'var(--faint)' }}>
                  {s === 'account' ? 'Аккаунт' : 'Параметры'}
                </span>
              </div>
              {i === 0 && (
                <div style={{
                  height: 1, flex: 1,
                  background: step === 'body' ? 'var(--accent-a30)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px' }}>

          {step === 'account' && (
            <>
              <Field
                label="Логин" value={account.login}
                onChange={v => setAccount(f => ({ ...f, login: v }))}
                error={accountErrors.login} placeholder="Придумайте логин"
              />
              <Field
                label="Пароль" value={account.password}
                onChange={v => setAccount(f => ({ ...f, password: v }))}
                error={accountErrors.password} placeholder="Минимум 10 символов, хотя бы одна цифра"
                type={showPassword ? 'text' : 'password'}
                rightEl={
                  <button onClick={() => setShowPassword(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0, fontSize: 16 }}>
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                }
              />
              <PasswordStrength password={account.password} />
              <Field
                label="Повтор пароля" value={account.confirmPassword}
                onChange={v => setAccount(f => ({ ...f, confirmPassword: v }))}
                error={accountErrors.confirmPassword} placeholder="Повторите пароль"
                type={showConfirm ? 'text' : 'password'}
                rightEl={
                  <button onClick={() => setShowConfirm(s => !s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0, fontSize: 16 }}>
                    {showConfirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                }
              />
              <button onClick={handleNextStep} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #34d399)',
                color: 'var(--accent-fg)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                marginTop: 8, transition: 'opacity 0.15s',
              }}>
                Далее →
              </button>
            </>
          )}

          {step === 'body' && (
            <>
              <p style={{ color: 'var(--dim)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
                Эти данные помогут отслеживать прогресс и давать точные рекомендации.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Возраст</label>
                <NumberInput value={body.age} onChange={v => setBody(f => ({ ...f, age: v }))} step={1} min={10} max={120} placeholder="Например: 25" />
                {bodyErrors.age && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{bodyErrors.age}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Рост (см)</label>
                <NumberInput value={body.height} onChange={v => setBody(f => ({ ...f, height: v }))} step={1} min={50} max={280} placeholder="Например: 175" />
                {bodyErrors.height && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{bodyErrors.height}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Начальный вес (кг)</label>
                <NumberInput value={body.weight} onChange={v => setBody(f => ({ ...f, weight: v }))} step={0.5} min={20} max={500} placeholder="Например: 75" />
                {bodyErrors.weight && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f87171' }}>{bodyErrors.weight}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 10 }}>Цель (необязательно)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBody(f => ({ ...f, goal: f.goal === opt.value ? '' : opt.value }))}
                      style={{
                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${body.goal === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                        background: body.goal === opt.value ? 'var(--accent-a10)' : 'var(--surface2)',
                        color: body.goal === opt.value ? 'var(--accent)' : 'var(--muted)',
                        fontSize: 13, fontWeight: body.goal === opt.value ? 600 : 400,
                        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {bodyErrors.api && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#f87171', fontSize: 13,
                }}>
                  {bodyErrors.api}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => setStep('account')} style={{
                  flex: 1, padding: '14px', borderRadius: 12,
                  border: '1px solid var(--border2)', background: 'var(--surface2)',
                  color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>← Назад</button>
                <button onClick={handleSubmit} disabled={loading} style={{
                  flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                  background: loading ? 'var(--accent-a30)' : 'linear-gradient(135deg, var(--accent), #34d399)',
                  color: 'var(--accent-fg)', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer',
                  transition: 'opacity 0.15s',
                }}>
                  {loading ? 'Создаём...' : 'Создать аккаунт'}
                </button>
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--faint)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

function getPasswordStrength(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  const long = p.length >= 10;
  const hasDigit = /\d/.test(p);
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);
  if (long && hasDigit && hasSpecial) return 3;
  if (long && hasDigit) return 2;
  return 1;
}

const STRENGTH_LABEL = ['', 'Слабый', 'Средний', 'Сильный'] as const;
const STRENGTH_COLOR = ['', '#f87171', '#fbbf24', '#34d399'] as const;

const PasswordStrength = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: -10, marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= strength ? STRENGTH_COLOR[strength] : 'var(--border)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: STRENGTH_COLOR[strength] }}>
        {STRENGTH_LABEL[strength]}
      </span>
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
    <label style={{ fontSize: 12, color: 'var(--dim)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--surface2)', color: 'var(--text)',
          borderRadius: 10, padding: rightEl ? '10px 40px 10px 14px' : '10px 14px',
          border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
          fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = error ? 'rgba(248,113,113,0.7)' : 'var(--accent-a25)')}
        onBlur={e => (e.target.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'var(--border)')}
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
