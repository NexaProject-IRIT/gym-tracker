const TAGS = ['#ноги', '#спина', '#грудь', '#плечи', '#руки', '#пресс', '#кардио'];

interface Props {
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

export const TagFilter = ({ selectedTag, onSelect }: Props) => (
  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 12 }}>
    {TAGS.map(tag => {
      const active = selectedTag === tag;
      return (
        <button
          key={tag}
          onClick={() => onSelect(active ? null : tag)}
          style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: active ? '1px solid var(--accent)' : '1px solid var(--border2)',
            background: active ? 'var(--accent)' : 'var(--border)',
            color: active ? 'var(--accent-fg)' : 'var(--dim)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {tag}
        </button>
      );
    })}
  </div>
);
