interface Props {
  value: string;
  onChange: (val: string) => void;
}

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

export const SearchBar = ({ value, onChange }: Props) => (
  <div style={{ position: 'relative', marginBottom: 10 }}>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--faint)', pointerEvents: 'none', display: 'flex' }}>
      <IconSearch />
    </span>
    <input
      type="text"
      placeholder="Поиск упражнения, мышц..."
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 12, padding: '10px 14px 10px 38px',
        fontSize: 14, color: 'var(--text)', outline: 'none',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent-a30)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
    />
  </div>
);
