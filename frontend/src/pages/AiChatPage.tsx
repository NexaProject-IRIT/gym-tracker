import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAiChatContext } from '../contexts/AiChatContext';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { MessageBubble } from '../components/AiChat/MessageBubble';
import { TypingIndicator } from '../components/AiChat/TypingIndicator';

const MAX_INPUT_LENGTH = 10000;

const SUGGESTED_PROMPTS = [
  'Составь тренировку на ноги и плечи',
  'Как улучшить технику приседа со штангой?',
  'Проанализируй мои последние тренировки',
  'Посоветуй программу для набора мышечной массы',
];

export const AiChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    clearHistory,
    addWorkoutFromSuggestion,
    addWorkoutsFromImport,
    applyWorkoutRenames,
    setError,
  } = useAiChatContext();

  const { fetchWorkouts } = useWorkoutsContext();

  const [input, setInput] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const showClearConfirm = (location.state as { modal?: string } | null)?.modal === 'confirm';
  const [addingWorkoutForId, setAddingWorkoutForId] = useState<string | null>(null);
  const [importingForId, setImportingForId] = useState<string | null>(null);
  const [renamingForId, setRenamingForId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoPromptSentRef = useRef(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Автоматически отправить промт, если он пришёл через location.state (кнопка «Совет тренера»)
  useEffect(() => {
    const state = location.state as { autoPrompt?: string } | null;
    if (!state?.autoPrompt || loading || autoPromptSentRef.current) return;
    autoPromptSentRef.current = true;
    sendMessage(state.autoPrompt);
    navigate(location.pathname, { replace: true, state: {} });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      setFileContent(text);
      setFileName(file.name);
      textareaRef.current?.focus();
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleSend = () => {
    const text = input.trim();
    if ((!text && !fileContent) || sending) return;
    const messageText = text || 'Импортируй тренировки из прикреплённого файла';
    sendMessage(messageText, fileContent ?? undefined, fileName ?? undefined);
    setInput('');
    setFileName(null);
    setFileContent(null);
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
    if (newId) {
      await fetchWorkouts();
      navigate('/workouts');
    }
    setAddingWorkoutForId(null);
  };

  const handleImportWorkouts = async (messageId: string) => {
    setImportingForId(messageId);
    const count = await addWorkoutsFromImport(messageId);
    if (count > 0) {
      await fetchWorkouts();
      navigate('/workouts');
    }
    setImportingForId(null);
  };

  const handleApplyRenames = async (messageId: string) => {
    setRenamingForId(messageId);
    const count = await applyWorkoutRenames(messageId);
    if (count > 0) await fetchWorkouts();
    setRenamingForId(null);
  };

  const handleClear = async () => {
    navigate(-1);
    await clearHistory();
  };

  const isEmpty = !loading && messages.length === 0;

  return (
    <>
      <style>{`
        .ai-textarea::placeholder { color: var(--faint); }
        .ai-send-btn:hover:not(:disabled) { background: #86efac !important; }
        .ai-prompt-chip:hover { background: var(--accent-a12) !important; border-color: var(--accent-a30) !important; }
        @keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .ai-chat-root {
          height: 100dvh;
          min-height: -webkit-fill-available;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          overflow: hidden;
        }

        @media (max-width: 767px) {
          .ai-chat-root { height: calc(100dvh - 56px); min-height: 0; }
        }

        .ai-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px 8px;
          display: flex;
          flex-direction: column;
        }

        .ai-input-bar {
          flex-shrink: 0;
          padding: 12px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        @media (min-width: 768px) {
          .ai-messages-area { padding: 24px 24px 8px; }
          .ai-input-bar { padding: 16px; }
        }
      `}</style>

      <div className="ai-chat-root">

        {/* Шапка */}
        <header style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent-a12)',
            border: '1px solid var(--accent-a20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>GymBot</div>
            <div style={{ color: 'var(--dim)', fontSize: 12 }}>Персональный ИИ-тренер</div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('.', { state: { modal: 'confirm' } })}
              style={{
                background: 'transparent',
                border: '1px solid var(--border2)',
                color: 'var(--muted)',
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
          {loading && (() => {
            const skBase: React.CSSProperties = {
              background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
              backgroundSize: '200% 100%',
              animation: 'sk-shimmer 1.4s ease-in-out infinite',
              borderRadius: 6,
            };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>
                {/* bot message 1 */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ ...skBase, width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: '72%' }}>
                    <div style={{ ...skBase, width: 220, height: 14 }} />
                    <div style={{ ...skBase, width: 170, height: 14 }} />
                    <div style={{ ...skBase, width: 195, height: 14 }} />
                  </div>
                </div>
                {/* user message 1 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ ...skBase, width: 160, height: 40, borderRadius: 16 }} />
                </div>
                {/* bot message 2 */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ ...skBase, width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: '60%' }}>
                    <div style={{ ...skBase, width: 185, height: 14 }} />
                    <div style={{ ...skBase, width: 145, height: 14 }} />
                    <div style={{ ...skBase, width: 200, height: 14 }} />
                    <div style={{ ...skBase, width: 120, height: 14 }} />
                  </div>
                </div>
                {/* user message 2 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ ...skBase, width: 120, height: 40, borderRadius: 16 }} />
                </div>
                {/* bot message 3 */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ ...skBase, width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: '68%' }}>
                    <div style={{ ...skBase, width: 200, height: 14 }} />
                    <div style={{ ...skBase, width: 155, height: 14 }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {isEmpty && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '20px 0', textAlign: 'center',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'var(--accent-a10)',
                border: '1px solid var(--accent-a20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
                    stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ color: 'var(--text)', fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>
                Привет! Я GymBot
              </h2>
              <p style={{ color: 'var(--dim)', fontSize: 13, maxWidth: 400, margin: '0 0 20px', lineHeight: 1.5 }}>
                Составлю тренировку, разберу технику, проанализирую твой прогресс и подберу программу под цель. Спроси:
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
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text3)',
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
              onApplyRenames={handleApplyRenames}
              applyingRenames={renamingForId === msg.id}
            />
          ))}

          {sending && <TypingIndicator />}
        </div>

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

        {/* Поле ввода */}
        <div className="ai-input-bar">
          {fileName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 6, padding: '5px 10px',
              background: 'var(--accent-a10)', border: '1px solid var(--accent-a20)',
              borderRadius: 8, fontSize: 12, color: 'var(--accent)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
              <button
                type="button"
                onClick={() => { setFileName(null); setFileContent(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
              </button>
            </div>
          )}
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '6px 6px 6px 8px',
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              title="Прикрепить текстовый файл"
              style={{
                width: 34, height: 34, borderRadius: 9, border: 'none',
                background: 'transparent', color: 'var(--ghost)',
                cursor: sending ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ghost)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder={fileContent ? 'Напиши команду к файлу (или просто нажми Enter)…' : 'Напиши сообщение или прикрепи .txt файл…'}
              rows={1}
              disabled={sending}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text2)',
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
              disabled={(!input.trim() && !fileContent) || sending}
              style={{
                width: 34, height: 34, borderRadius: 9,
                border: 'none',
                cursor: ((!input.trim() && !fileContent) || sending) ? 'default' : 'pointer',
                background: ((!input.trim() && !fileContent) || sending) ? 'var(--accent-a25)' : 'var(--accent)',
                color: 'var(--accent-fg)',
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
          <div style={{ fontSize: 11, color: 'var(--faint)', textAlign: 'center', marginTop: 6 }}>
            Enter — отправить · Shift+Enter — перенос
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            borderRadius: 14,
            padding: 24,
            maxWidth: 360,
            width: '100%',
          }}>
            <h3 style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 16 }}>Очистить историю чата?</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
              Все сообщения будут удалены безвозвратно. Тренировки, добавленные из чата, останутся.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--text3)', cursor: 'pointer', fontSize: 13,
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
