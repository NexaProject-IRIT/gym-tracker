import React, { useEffect, useRef, useState } from 'react';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Если задан — кнопка «Удалить» неактивна пока юзер не введёт это слово.
  // Защита от случайного клика по необратимым операциям (clear history и т.п.).
  confirmWord?: string;
  confirmButtonLabel?: string;
}

export const ConfirmModal: React.FC<Props> = ({
  message, onConfirm, onCancel, confirmWord, confirmButtonLabel = 'Удалить',
}) => {
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (confirmWord) inputRef.current?.focus();
  }, [confirmWord]);

  const matches = !confirmWord || typed.trim() === confirmWord;
  const handleConfirm = () => { if (matches) onConfirm(); };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20,
        border: '1px solid var(--border2)',
        padding: 28, maxWidth: 400, width: '100%',
      }}>
        <p style={{ color: 'var(--text)', fontSize: 15, margin: '0 0 18px', lineHeight: 1.5 }}>{message}</p>

        {confirmWord && (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
              Чтобы подтвердить, введите слово <b style={{ color: 'var(--text)' }}>{confirmWord}</b>:
            </div>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder={confirmWord}
              autoCapitalize="characters"
              spellCheck={false}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                border: '1px solid var(--border2)', background: 'var(--surface2)',
                color: 'var(--text)', fontSize: 14, marginBottom: 20, outline: 'none',
              }}
            />
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: '1px solid var(--border2)', background: 'transparent',
            color: 'var(--muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>Отмена</button>
          <button onClick={handleConfirm} disabled={!matches} style={{
            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
            background: 'rgba(248,113,113,0.15)',
            color: '#f87171', fontWeight: 700, fontSize: 14,
            cursor: matches ? 'pointer' : 'not-allowed',
            opacity: matches ? 1 : 0.45,
          }}>{confirmButtonLabel}</button>
        </div>
      </div>
    </div>
  );
};
