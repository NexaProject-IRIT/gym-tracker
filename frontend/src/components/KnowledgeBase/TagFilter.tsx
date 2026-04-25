const TAGS = ['#ноги', '#спина', '#грудь', '#плечи', '#руки', '#пресс', '#кардио'];

interface Props {
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

export const TagFilter = ({ selectedTag, onSelect }: Props) => (
  <div className="flex flex-wrap gap-2 mb-8">
    {TAGS.map(tag => (
      <button
        key={tag}
        onClick={() => onSelect(selectedTag === tag ? null : tag)}
        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
          selectedTag === tag ? 'bg-[#6ee7b7] text-[#111318] border-[#6ee7b7]' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
        }`}
      >
        {tag}
      </button>
    ))}
  </div>
);
