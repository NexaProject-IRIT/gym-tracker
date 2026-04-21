import type { ReactNode } from 'react';
import type { ChatMessage } from '../../hooks/useAiChat';
import { WorkoutSuggestionCard } from './WorkoutSuggestionCard';

interface Props {
  message: ChatMessage;
  onAddWorkout: (messageId: string) => void;
  addingWorkout: boolean;
}

// ─── Inline-парсер: **жирный**, *курсив*, `код` ──────────────────────────────
// Разбиваем строку по маркерам, оборачиваем в нужные теги.
const parseInline = (text: string): ReactNode[] => {
  const INLINE_RE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: '#f1f5f9' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          fontFamily: 'monospace',
          fontSize: '0.9em',
          background: 'rgba(110,231,183,0.1)',
          color: '#6ee7b7',
          padding: '1px 5px',
          borderRadius: 4,
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// ─── Блочный парсер ───────────────────────────────────────────────────────────
// Обрабатываем построчно: заголовки, списки, горизонтальные разделители, параграфы.
const renderMarkdown = (text: string): ReactNode => {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- Горизонтальный разделитель ---
    if (/^---+$/.test(line.trim())) {
      elements.push(
        <hr key={key++} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '8px 0' }} />
      );
      i++;
      continue;
    }

    // --- Заголовки ### ## # ---
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const sizes: Record<number, { fontSize: string; mt: number }> = {
        1: { fontSize: '17px', mt: 16 },
        2: { fontSize: '15px', mt: 12 },
        3: { fontSize: '14px', mt: 10 },
      };
      const { fontSize, mt } = sizes[level] || sizes[3];
      elements.push(
        <div key={key++} style={{
          fontSize,
          fontWeight: 700,
          color: '#f1f5f9',
          marginTop: i > 0 ? mt : 0,
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {parseInline(content)}
        </div>
      );
      i++;
      continue;
    }

    // --- Список: строки начинающиеся с "- " или "• " ---
    if (/^[-•]\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-•]\s/, '');
        items.push(
          <li key={i} style={{
            color: '#cbd5e1',
            lineHeight: 1.55,
            marginBottom: 3,
            paddingLeft: 4,
          }}>
            {parseInline(itemText)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={key++} style={{
          margin: '6px 0',
          paddingLeft: 18,
          listStyleType: 'disc',
        }}>
          {items}
        </ul>
      );
      continue;
    }

    // --- Нумерованный список: "1. " "2. " и т.п. ---
    if (/^\d+\.\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s/, '');
        items.push(
          <li key={i} style={{ color: '#cbd5e1', lineHeight: 1.55, marginBottom: 3, paddingLeft: 4 }}>
            {parseInline(itemText)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={key++} style={{ margin: '6px 0', paddingLeft: 20 }}>
          {items}
        </ol>
      );
      continue;
    }

    // --- Пустая строка → небольшой отступ ---
    if (line.trim() === '') {
      // Несколько пустых строк схлопываем в один отступ
      if (elements.length > 0) {
        elements.push(<div key={key++} style={{ height: 8 }} />);
      }
      i++;
      continue;
    }

    // --- Обычный параграф ---
    elements.push(
      <p key={key++} style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, wordBreak: 'break-word' }}>
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
};

// ─── Аватар бота ─────────────────────────────────────────────────────────────
const BotAvatar = () => (
  <div style={{
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    background: 'rgba(110,231,183,0.12)',
    border: '1px solid rgba(110,231,183,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
        stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

// ─── Компонент ───────────────────────────────────────────────────────────────
export const MessageBubble = ({ message, onAddWorkout, addingWorkout }: Props) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '80%',
          background: '#6ee7b7',
          color: '#0f1419',
          padding: '10px 14px',
          borderRadius: '16px 16px 4px 16px',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // ─── Ответ ассистента ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
      <BotAvatar />
      <div style={{
        flex: 1,
        minWidth: 0,
        background: '#1a1d24',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 14px',
        borderRadius: '4px 16px 16px 16px',
        fontSize: 14,
      }}>
        {message.content && renderMarkdown(message.content)}

        {message.workout_suggestion && (
          <WorkoutSuggestionCard
            suggestion={message.workout_suggestion}
            onAdd={() => onAddWorkout(message.id)}
            added={!!message.workoutAdded}
            loading={addingWorkout}
          />
        )}
      </div>
    </div>
  );
};