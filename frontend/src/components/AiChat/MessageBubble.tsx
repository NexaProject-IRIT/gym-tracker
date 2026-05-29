import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ChatMessage } from '../../hooks/useAiChat';
import { WorkoutSuggestionCard } from './WorkoutSuggestionCard';
import { WorkoutImportCard } from './WorkoutImportCard';
import { WorkoutRenameCard } from './WorkoutRenameCard';

interface Props {
  message: ChatMessage;
  onAddWorkout: (messageId: string) => void;
  addingWorkout: boolean;
  onImportWorkouts: (messageId: string) => void;
  importingWorkouts: boolean;
  onApplyRenames: (messageId: string) => void;
  applyingRenames: boolean;
}

const MD_COMPONENTS: Components = {
  p: ({ children }) => (
    <p style={{ margin: '0 0 8px', color: 'var(--text3)', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {children}
    </p>
  ),
  h1: ({ children }) => (
    <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '16px 0 6px', lineHeight: 1.3, wordBreak: 'break-word' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '14px 0 5px', lineHeight: 1.3, wordBreak: 'break-word' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '12px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', margin: '10px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', margin: '8px 0 3px', lineHeight: 1.3 }}>
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', margin: '8px 0 3px', lineHeight: 1.3 }}>
      {children}
    </h6>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '6px 0', paddingLeft: 20, color: 'var(--text3)' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '6px 0', paddingLeft: 22, color: 'var(--text3)' }}>{children}</ol>
  ),
  li: ({ children }) => (
    <li style={{ marginBottom: 4, lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: 'var(--text)' }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: 'italic', color: 'var(--text2)' }}>{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = !!className;
    if (isBlock) {
      return (
        <code style={{
          display: 'block',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 13,
          background: 'var(--bg)',
          color: 'var(--accent)',
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
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: '0.88em',
        background: 'var(--accent-a10)',
        color: 'var(--accent)',
        padding: '2px 6px',
        borderRadius: 4,
        wordBreak: 'break-word',
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
      background: 'var(--bg)',
      border: '1px solid var(--border)',
    }}>
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '8px 0',
      paddingLeft: 12,
      borderLeft: '3px solid var(--accent-a30)',
      color: 'var(--muted)',
      fontStyle: 'italic',
    }}>
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13, color: 'var(--text3)' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      padding: '7px 12px', background: 'var(--border)',
      borderBottom: '1px solid var(--border2)',
      textAlign: 'left', fontWeight: 600,
      color: 'var(--text2)', whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{
      padding: '6px 12px',
      borderBottom: '1px solid var(--border)',
      wordBreak: 'break-word',
    }}>
      {children}
    </td>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: 'var(--accent)', textDecoration: 'underline', wordBreak: 'break-all',
    }}>
      {children}
    </a>
  ),
};

const SparkleIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2l1.8 5.6a4 4 0 0 0 2.6 2.6L22 12l-5.6 1.8a4 4 0 0 0-2.6 2.6L12 22l-1.8-5.6a4 4 0 0 0-2.6-2.6L2 12l5.6-1.8a4 4 0 0 0 2.6-2.6L12 2z"/>
  </svg>
);

export const MessageBubble = ({
  message, onAddWorkout, addingWorkout,
  onImportWorkouts, importingWorkouts,
  onApplyRenames, applyingRenames,
}: Props) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        marginBottom: 14, gap: 6, maxWidth: '100%',
      }}>
        {message.file_name && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px',
            background: 'var(--accent-a12)',
            border: '1px solid rgba(110,231,183,0.18)',
            borderRadius: 10,
            color: 'var(--accent)',
            fontSize: 12, fontWeight: 500,
            maxWidth: '85%',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {message.file_name}
            </span>
          </div>
        )}
        <div style={{
          maxWidth: '85%',
          background: 'var(--accent-a12)',
          border: '1px solid rgba(110,231,183,0.18)',
          color: 'var(--text)',
          padding: '10px 14px',
          borderRadius: '16px 6px 16px 16px',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // AI message — full width, teal left border, "ИИ-тренер" label
  return (
    <div style={{
      width: '100%',
      marginBottom: 14,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '2.5px solid var(--accent)',
      borderRadius: '6px 16px 16px 16px',
      padding: '13px 15px',
      minWidth: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 7,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
        color: 'var(--accent)',
      }}>
        <SparkleIcon />
        ИИ-тренер
      </div>

      {message.content && (
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>
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

      {message.workout_renames && message.workout_renames.length > 0 && (
        <WorkoutRenameCard
          renames={message.workout_renames}
          onApply={() => onApplyRenames(message.id)}
          applied={!!message.workoutsRenamed}
          loading={applyingRenames}
        />
      )}
    </div>
  );
};
