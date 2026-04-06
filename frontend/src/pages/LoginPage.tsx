import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface LoginForm {
  login: string;
  password: string;
}

interface FormErrors {
  login?: string;
  password?: string;
  api?: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ login: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.login.trim()) e.login = 'Введите логин';
    if (!form.password) e.password = 'Введите пароль';
    else if (form.password.length < 6) e.password = 'Минимум 6 символов';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch('http://localhost:8000/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.login, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ api: data.error || 'Неверные данные' });
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch {
      setErrors({ api: 'Нет связи с сервером' });
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
          <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Войдите в свой аккаунт</p>
        </div>

        {/* Форма */}
        <div style={{
          background: '#1a1d24', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '28px',
        }}>
          <Field
            label="Логин"
            value={form.login}
            onChange={v => setForm(f => ({ ...f, login: v }))}
            error={errors.login}
            placeholder="Введите логин"
          />

          <Field
            label="Пароль"
            value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            error={errors.password}
            placeholder="Введите пароль"
            type={showPassword ? 'text' : 'password'}
            rightEl={
              <button
                onClick={() => setShowPassword(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, fontSize: 16 }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            }
          />

          {errors.api && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              color: '#f87171', fontSize: 13,
            }}>
              {errors.api}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: loading ? 'rgba(110,231,183,0.4)' : 'linear-gradient(135deg, #6ee7b7, #34d399)',
              color: '#052e16', fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
              marginTop: 8, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#475569' }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: '#6ee7b7', textDecoration: 'none', fontWeight: 600 }}>
              Зарегистрироваться
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