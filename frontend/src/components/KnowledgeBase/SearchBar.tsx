import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar = ({ value, onChange }: Props) => (
  <div className="relative mb-6">
    <input
      type="text"
      placeholder="Поиск тренажера, упражнения или мышц..."
      className="w-full bg-[#1a1d24] border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-[#6ee7b7] transition-all text-lg shadow-xl"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 opacity-50" />
  </div>
);
