import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ChatMessage } from '../../hooks/useAiChat';
import { WorkoutSuggestionCard } from './WorkoutSuggestionCard';
import { WorkoutImportCard } from './WorkoutImportCard';

interface Props {
  message: ChatMessage;
  onAddWorkout: (messageId: string) => void;
  addingWorkout: boolean;
  onImportWorkouts: (messageId: string) => void;
  importingWorkouts: boolean;
}

// Кастомные компоненты для стилизации под тёмную тему
const MD_COMPONENTS: Components = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 8px', color: '#cbd5e1', lineHeight: 1.65, wordBreak: 'break-word' }}>
      {children}
    </p>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '16px 0 6px', lineHeight: 1.3 }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '14px 0 5px', lineHeight: 1.3 }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '12px 0 4px', lineHeight: 1.3 }}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '10px 0 4px', lineHeight: 1.3 }}>
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '8px 0 3px', lineHeight: 1.3 }}>
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: '8px 0 3px', lineHeight: 1.3 }}>
      {children}
    </h6>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '6px 0', paddingLeft: 20, color: '#cbd5e1' }}>
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '6px 0', paddingLeft: 22, color: '#cbd5e1' }}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: 4, lineHeight: 1.6 }}>
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: '#f1f5f9' }}>
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: 'italic', color: '#e2e8f0' }}>
      {children}
    </em>
  ),
  code: ({ children, className }) => {
    const isBlock = !!className;
    if (isBlock) {
      return (
        <code style={{
          display: 'block',
          fontFamily: 'monospace',
          fontSize: 13,
          background: 'rgba(0,0,0,0.3)',
          color: '#6ee7b7',
          padding: '10px 14px',
          borderRadius: 8,
          overflowX: 'auto',
          lineHeight: 1.6,
          whiteSpace: 'pre',
        }}>
          {children}
        </code>
      );
    }
    return (
      <code style={{
        fontFamily: 'monospace',
        fontSize: '0.88em',
        background: 'rgba(110,231,183,0.1)',
        color: '#6ee7b7',
        padding: '2px 6px',
        borderRadius: 4,
      }}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre style={{
      margin: '8px 0',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '8px 0',
      paddingLeft: 12,
      borderLeft: '3px solid rgba(110,231,183,0.4)',
      color: '#94a3b8',
      fontStyle: 'italic',
    }}>
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: 13,
        color: '#cbd5e1',
      }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      padding: '7px 12px',
      background: 'rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'left',
      fontWeight: 600,
      color: '#e2e8f0',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: '6px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {children}
    </td>
  ),
};

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

export const MessageBubble = ({ message, onAddWorkout, addingWorkout, onImportWorkouts, importingWorkouts }: Props) => {
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
        {message.content && (
          <div style={{ lineHeight: 1.65 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.workout_suggestion && (
          <WorkoutSuggestionCard
            suggestion={message.workout_suggestion}
            onAdd={() => onAddWorkout(message.id)}
            added={!!message.workoutAdded}
            loading={addingWorkout}
          />
        )}

        {message.workout_imports && message.workout_imports.length > 0 && (
          <WorkoutImportCard
            imports={message.workout_imports}
            onImport={() => onImportWorkouts(message.id)}
            imported={!!message.workoutsImported}
            loading={importingWorkouts}
          />
        )}
      </div>
    </div>
  );
};
