import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAiChatContext } from '../contexts/AiChatContext';
import { MessageBubble } from '../components/AiChat/MessageBubble';
import { TypingIndicator } from '../components/AiChat/TypingIndicator';

const MAX_MESSAGE_LENGTH = 2000;

const SUGGESTED_PROMPTS = [
  'Составь тренировку на ноги и плечи',
  'Как улучшить технику приседа со штангой?',
  'Проанализируй мои последние тренировки',
  'Посоветуй программу для набора мышечной массы',
];

export const AiChatPage = () => {
  const navigate = useNavigate();

  // Берём стейт из контекста (живёт в MainLayout, не сбрасывается при навигации)
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    clearHistory,
    addWorkoutFromSuggestion,
    addWorkoutsFromImport,
    setError,
  } = useAiChatContext();

  const [input, setInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [addingWorkoutForId, setAddingWorkoutForId] = useState<string | null>(null);
  const [importingForId, setImportingForId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоскролл к низу при новых сообщениях
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Автоподгон высоты textarea под содержимое (до 5 строк)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddWorkout = async (messageId: string) => {
    setAddingWorkoutForId(messageId);
    const newId = await addWorkoutFromSuggestion(messageId);
    setAddingWorkoutForId(null);
    if (newId) {
      setTimeout(() => navigate('/workouts'), 900);
    }
  };

  const handleImportWorkouts = async (messageId: string) => {
    setImportingForId(messageId);
    const count = await addWorkoutsFromImport(messageId);
    setImportingForId(null);
    if (count > 0) {
      setTimeout(() => navigate('/workouts'), 1200);
    }
  };

  const handleClear = async () => {
    setShowClearConfirm(false);
    await clearHistory();
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <>
      <style>{`
        .ai-textarea::placeholder { color: #475569; }
        .ai-send-btn:hover:not(:disabled) { background: #86efac !important; }
        .ai-prompt-chip:hover { background: rgba(110,231,183,0.12) !important; border-color: rgba(110,231,183,0.35) !important; }

        /*
         * Ключевой фикс мобилки:
         * - 100dvh = dynamic viewport height, учитывает адресную строку браузера
         * - min-height: -webkit-fill-available = fallback для Safari iOS
         * Без этого контейнер вылезает за экран и поле ввода оказывается
         * под адресной строкой браузера.
         */
        .ai-chat-root {
          height: 100dvh;
          min-height: -webkit-fill-available;
          display: flex;
          flex-direction: column;
          background: #111318;
          overflow: hidden;
        }

        /* На мобиле нижний таббар — 64px position:fixed.
           main добавляет paddingBottom: 64px, поэтому без этой поправки
           ai-chat-root (100dvh) + padding (64px) > viewport → браузер добавляет скролл,
           шапка уезжает вверх, а поле ввода уходит под таббар. */
        @media (max-width: 767px) {
          .ai-chat-root {
            height: calc(100dvh - 64px);
            min-height: 0;
          }
        }

        /* Область сообщений — растягивается на всё доступное пространство */
        .ai-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          /* Отступ снизу под нижний таббар на мобиле (64px) */
          padding-bottom: 8px;
        }

        /* Поле ввода — прилипает к низу, никуда не уходит */
        .ai-input-bar {
          flex-shrink: 0;
          padding: 12px 12px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: #1a1d24;
          /* safe-area-inset-bottom — для iPhone с чёлкой */
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        }

        @media (min-width: 768px) {
          .ai-messages-area { padding: 24px; }
          .ai-input-bar { padding: 16px; padding-bottom: 16px; }
        }
      `}</style>

      <div className="ai-chat-root">

        {/* Шапка */}
        <header style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#1a1d24',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(110,231,183,0.12)',
            border: '1px solid rgba(110,231,183,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>GymBot</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Персональный ИИ-тренер</div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
                padding: '7px 11px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Очистить
            </button>
          )}
        </header>

        {/* Область сообщений */}
        <div className="ai-messages-area" ref={scrollRef}>
          {loading && (
            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Загружаю историю…
            </div>
          )}

          {isEmpty && (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 0',
              textAlign: 'center',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(110,231,183,0.1)',
                border: '1px solid rgba(110,231,183,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                    stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>
                Привет! Я GymBot
              </h2>
              <p style={{ color: '#64748b', fontSize: 13, maxWidth: 400, margin: '0 0 20px', lineHeight: 1.5 }}>
                Составлю тренировку, разберу технику, проанализирую твой прогресс
                и подберу программу под цель. Спроси:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-prompt-chip"
                    onClick={() => sendMessage(prompt)}
                    disabled={sending}
                    style={{
                      background: '#1a1d24',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                      padding: '9px 13px',
                      borderRadius: 10,
                      cursor: sending ? 'default' : 'pointer',
                      fontSize: 13,
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isEmpty && messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onAddWorkout={handleAddWorkout}
              addingWorkout={addingWorkoutForId === msg.id}
              onImportWorkouts={handleImportWorkouts}
              importingWorkouts={importingForId === msg.id}
            />
          ))}

          {sending && <TypingIndicator />}
        </div>

        {/* Ошибка */}
        {error && (
          <div style={{
            padding: '9px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderTop: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 4 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Поле ввода — всегда прилипает к низу */}
        <div className="ai-input-bar">
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            background: '#111318',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '6px 6px 6px 12px',
          }}>
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="Напиши сообщение…"
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e2e8f0',
                fontSize: 14,
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                padding: '6px 0',
                maxHeight: 140,
              }}
            />
            <button
              type="button"
              className="ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              style={{
                width: 34, height: 34, borderRadius: 9,
                border: 'none',
                cursor: (!input.trim() || sending) ? 'default' : 'pointer',
                background: (!input.trim() || sending) ? 'rgba(110,231,183,0.25)' : '#6ee7b7',
                color: '#0f1419',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l16-8-6 16-2-7-8-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 6 }}>
            Enter — отправить · Shift+Enter — перенос
          </div>
        </div>
      </div>

      {/* Модалка подтверждения очистки */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#1a1d24',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 24,
            maxWidth: 360,
            width: '100%',
          }}>
            <h3 style={{ margin: '0 0 10px', color: '#f1f5f9', fontSize: 16 }}>Очистить историю чата?</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
              Все сообщения будут удалены безвозвратно. Тренировки, добавленные из чата, останутся.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1', cursor: 'pointer', fontSize: 13,
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: '#ef4444', border: 'none',
                  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};