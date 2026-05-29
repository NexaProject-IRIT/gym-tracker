import React, { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAiChatContext } from '../contexts/AiChatContext';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { apiFetch } from '../lib/api';
import { MessageBubble } from '../components/AiChat/MessageBubble';
import { TypingIndicator } from '../components/AiChat/TypingIndicator';

type AiStatus = 'checking' | 'online' | 'offline';
const STATUS_REFRESH_MS = 60_000;

const STATUS_META: Record<AiStatus, { label: string; color: string; bg: string }> = {
  checking: { label: 'Проверка…',  color: 'var(--ghost)',   bg: 'var(--ghost)'   },
  online:   { label: 'На связи',   color: 'var(--accent)',  bg: 'var(--accent)'  },
  offline:  { label: 'Не в сети',  color: '#f87171',        bg: '#f87171'        },
};

const MAX_INPUT_LENGTH = 10000;

const SUGGESTED_PROMPTS = [
  'Составь тренировку на ноги и плечи',
  'Как улучшить технику приседа со штангой?',
  'Проанализируй мои последние тренировки',
  'Посоветуй программу для набора мышечной массы',
];

const QUICK_CHIPS = [
  'Составь тренировку',
  'Что поесть после?',
  'Разбор техники',
];

const SparkleIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.8 5.6a4 4 0 0 0 2.6 2.6L22 12l-5.6 1.8a4 4 0 0 0-2.6 2.6L12 22l-1.8-5.6a4 4 0 0 0-2.6-2.6L2 12l5.6-1.8a4 4 0 0 0 2.6-2.6L12 2z"/>
  </svg>
);

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
  const [fileName, setFileName] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [aiStatus, setAiStatus] = useState<AiStatus>('checking');

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const data = await apiFetch<{ status: string }>('/ai/health/');
        if (!cancelled) setAiStatus(data.status === 'online' ? 'online' : 'offline');
      } catch {
        if (!cancelled) setAiStatus('offline');
      }
    };
    check();
    const id = window.setInterval(check, STATUS_REFRESH_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const showClearConfirm = (location.state as { modal?: string } | null)?.modal === 'confirm';
  const [addingWorkoutForId, setAddingWorkoutForId] = useState<string | null>(null);
  const [importingForId, setImportingForId] = useState<string | null>(null);
  const [renamingForId, setRenamingForId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoPromptSentRef = useRef(false);

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
  const canSend = (input.trim().length > 0 || !!fileContent) && !sending;
  const showChips = isEmpty || messages.length === 0;

  return (
    <>
      <style>{`
        .ai-chat-root {
          display: flex;
          flex-direction: column;
          background: var(--bg);
          height: 100dvh;
          overflow: hidden;
        }
        @media (max-width: 767px) {
          /* Mobile nav (~50px content + safe-area-inset) sits fixed at viewport bottom.
             Pin the chat root above it so the input bar is flush against the nav top — no gap. */
          .ai-chat-root {
            position: fixed;
            top: 0; left: 0; right: 0;
            bottom: calc(50px + env(safe-area-inset-bottom, 0px));
            height: auto;
          }
        }

        .ai-messages-area {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 14px 8px;
          display: flex;
          flex-direction: column;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        .ai-messages-area::-webkit-scrollbar { display: none; width: 0; height: 0; }

        @media (min-width: 768px) {
          .ai-messages-area { padding: 24px 24px 8px; }
        }

        .ai-bar-wrap {
          flex-shrink: 0;
          position: relative;
          padding: 10px 12px;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        @media (min-width: 768px) {
          .ai-bar-wrap { padding: 14px 16px; }
        }
        .ai-bar-wrap::before {
          content: '';
          position: absolute;
          top: -1px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0;
          transition: opacity .3s ease;
          box-shadow: 0 0 12px rgba(110,231,183,0.7);
          pointer-events: none;
        }
        .ai-bar-wrap.focused::before { opacity: 1; }

        .ai-chips {
          display: flex; gap: 8px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 10px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ai-chips::-webkit-scrollbar { display: none; }

        .ai-chip {
          flex-shrink: 0; cursor: pointer;
          background: var(--bg);
          border: 1px solid rgba(110,231,183,0.35);
          color: var(--accent);
          font-family: inherit; font-size: 12.5px; font-weight: 500;
          padding: 7px 13px; border-radius: 999px; white-space: nowrap;
          transition: background .2s, transform .12s;
        }
        .ai-chip:hover:not(:disabled) { background: var(--accent-a12); }
        .ai-chip:active:not(:disabled) { transform: scale(0.96); }
        .ai-chip:disabled { opacity: 0.5; cursor: default; }

        .ai-inrow {
          display: flex; align-items: flex-end; gap: 6px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 5px 5px 5px 6px;
          transition: border-color .2s;
        }
        .ai-inrow.focused { border-color: rgba(110,231,183,0.4); }

        .ai-textarea {
          flex: 1; min-width: 0;
          border: none; outline: none; resize: none;
          background: transparent; color: var(--text);
          font-family: inherit; font-size: 15px; line-height: 1.4;
          padding: 9px 4px; max-height: 140px; overflow-y: auto;
          scrollbar-width: none;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .ai-textarea::-webkit-scrollbar { display: none; }
        .ai-textarea::placeholder { color: var(--ghost); }

        .ai-icon-btn {
          flex-shrink: 0; width: 36px; height: 36px;
          border: none; cursor: pointer; padding: 0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; color: var(--ghost);
          transition: background .2s, color .2s, transform .12s;
        }
        .ai-icon-btn:hover:not(:disabled) { background: var(--border); color: var(--text); }
        .ai-icon-btn:active:not(:disabled) { transform: scale(0.92); }
        .ai-icon-btn:disabled { opacity: 0.4; cursor: default; }

        .ai-send {
          flex-shrink: 0; width: 38px; height: 38px;
          border: none; cursor: pointer; padding: 0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--border);
          color: var(--ghost);
          transition: background .25s, color .25s, transform .12s, box-shadow .25s;
        }
        .ai-send.ready {
          background: linear-gradient(135deg, var(--accent), var(--accent2, #41d6a3));
          color: #06281c;
          box-shadow: 0 6px 16px -4px rgba(110,231,183,0.6);
        }
        .ai-send:active:not(:disabled) { transform: scale(0.92); }
        .ai-send:disabled { cursor: default; }

        .ai-empty-chip {
          background: var(--surface);
          border: 1px solid rgba(110,231,183,0.25);
          color: var(--accent);
          padding: 9px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 13px; font-weight: 500;
          transition: background .2s, transform .12s, border-color .2s;
        }
        .ai-empty-chip:hover:not(:disabled) {
          background: var(--accent-a12);
          border-color: var(--accent);
        }
        .ai-empty-chip:active:not(:disabled) { transform: scale(0.97); }
        .ai-empty-chip:disabled { opacity: 0.5; cursor: default; }

        @keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .ai-clear-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ghost);
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 12px;
          display: flex; align-items: center; gap: 5px;
          flex-shrink: 0;
          transition: background .2s, color .2s, border-color .2s;
        }
        .ai-clear-btn:hover { background: var(--border); color: var(--text); border-color: var(--border2); }
      `}</style>

      <div className="ai-chat-root">

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #2a3038, #14171d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1.5px var(--accent), 0 0 14px -3px rgba(110,231,183,0.6)',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            <SparkleIcon size={14} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>ИИ-тренер</span>
            <span
              title={aiStatus === 'offline' ? 'API недоступно. Сообщения могут не отправляться.' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12,
                color: STATUS_META[aiStatus].color,
                transition: 'color .3s',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: STATUS_META[aiStatus].bg,
                boxShadow: aiStatus === 'online' ? '0 0 6px var(--accent)' : 'none',
                transition: 'background .3s, box-shadow .3s',
              }} />
              {STATUS_META[aiStatus].label}
            </span>
          </div>
          {messages.length > 0 && (
            <button type="button" className="ai-clear-btn" onClick={() => navigate('.', { state: { modal: 'confirm' } })}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Очистить
            </button>
          )}
        </header>

        {/* Messages */}
        <div className="ai-messages-area" ref={scrollRef}>
          {loading && (() => {
            const skBase: React.CSSProperties = {
              background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
              backgroundSize: '200% 100%',
              animation: 'sk-shimmer 1.4s ease-in-out infinite',
              borderRadius: 6,
            };
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* AI msg skeletons - full width */}
                {[1, 2].map(i => (
                  <div key={`b-${i}`} style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    borderLeft: '2.5px solid var(--accent-a30)',
                    borderRadius: '6px 16px 16px 16px',
                    padding: 13,
                  }}>
                    <div style={{ ...skBase, width: 80, height: 12, marginBottom: 10 }} />
                    <div style={{ ...skBase, width: '92%', height: 13, marginBottom: 7 }} />
                    <div style={{ ...skBase, width: '74%', height: 13, marginBottom: 7 }} />
                    <div style={{ ...skBase, width: '88%', height: 13 }} />
                  </div>
                ))}
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
                  <div style={{ ...skBase, width: 180, height: 38, borderRadius: 16 }} />
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
                width: 64, height: 64, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, #2a3038, #14171d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 1.5px var(--accent), 0 0 20px -4px rgba(110,231,183,0.6)',
                marginBottom: 18,
                color: 'var(--accent)',
              }}>
                <SparkleIcon size={26} />
              </div>
              <h2 style={{ color: 'var(--text)', fontSize: 20, margin: '0 0 8px', fontWeight: 700 }}>
                Привет! Я ИИ-тренер
              </h2>
              <p style={{
                color: 'var(--ghost)', fontSize: 14, maxWidth: 440,
                margin: '0 0 22px', lineHeight: 1.5,
                padding: '0 12px',
              }}>
                Составлю тренировку, разберу технику, проанализирую прогресс и подберу программу под цель.
              </p>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                justifyContent: 'center', maxWidth: 560,
                padding: '0 8px',
              }}>
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-empty-chip"
                    onClick={() => sendMessage(prompt)}
                    disabled={sending}
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
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <span style={{ flex: 1, wordBreak: 'break-word' }}>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 4, flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Input bar */}
        <div className={`ai-bar-wrap${focused ? ' focused' : ''}`}>
          {fileName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 8, padding: '6px 10px',
              background: 'var(--accent-a12)', border: '1px solid rgba(110,231,183,0.25)',
              borderRadius: 10, fontSize: 12, color: 'var(--accent)',
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

          {showChips && messages.length === 0 && !loading && (
            <div className="ai-chips">
              {QUICK_CHIPS.map((chip, i) => {
                const fill = [
                  'Составь тренировку на сегодня',
                  'Что поесть после тренировки?',
                  'Разбери мою технику жима',
                ][i];
                return (
                  <button
                    key={chip}
                    type="button"
                    className="ai-chip"
                    onClick={() => {
                      setInput(fill);
                      textareaRef.current?.focus();
                    }}
                    disabled={sending}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          )}

          <div className={`ai-inrow${focused ? ' focused' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="ai-icon-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              title="Прикрепить файл"
              aria-label="Прикрепить файл"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              className="ai-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                fileContent
                  ? (isMobile ? 'Команда к файлу…' : 'Команда к файлу (или Enter)…')
                  : (isMobile ? 'Сообщение тренеру…' : 'Спроси тренера или опиши тренировку…')
              }
              rows={1}
              disabled={sending}
            />

            <button
              type="button"
              className={`ai-send${canSend ? ' ready' : ''}`}
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Отправить"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="18" y2="12"/>
                <polyline points="12 6 19 12 12 18"/>
              </svg>
            </button>
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
