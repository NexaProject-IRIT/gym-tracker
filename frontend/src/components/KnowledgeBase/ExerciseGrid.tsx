import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';
import { ExerciseModal } from './ExerciseModal';
import { ExerciseCard } from './ExerciseCard';
import { EquipmentCard } from './EquipmentCard';
import type { Exercise } from '../../types/workout';

interface Equipment {
  id: string;
  name: string;
  image: string | null;
}

const authHeaders = () => ({
  Authorization: `Token ${localStorage.getItem('token') ?? ''}`,
});

export const ExerciseGrid = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'equipment'>('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // useRef для debounce — не пересоздаётся при ре-рендерах
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Загрузка упражнений (с сервера) ─────────────────────────────────────
  const fetchExercises = async (query: string, tag: string | null, equipmentFilter: string | null) => {
    setLoading(true);
    try {
      // Если есть поисковый запрос — идём на /exercises/search/, иначе на /exercises/
      const url = query.trim() ? `/exercises/search/` : `/exercises/`;
      const params = new URLSearchParams();

      if (query.trim()) params.append('q', query.trim());
      // Передаём тег без символа # (например, ?tag=ноги)
      if (tag) params.append('tag', tag.replace('#', ''));
      // Фильтр по тренажёру — только при вкладке equipment и выбранном тренажёре
      if (equipmentFilter) params.append('equipment', equipmentFilter);

      const res = await fetch(`${url}?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setExercises(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки упражнений:', e);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Загрузка тренажёров (один раз) ──────────────────────────────────────
  const fetchEquipment = async () => {
    try {
      const res = await fetch(`/exercises/equipment/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки тренажёров:', e);
    }
  };

  // ─── Debounce для поискового запроса ─────────────────────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (search.trim()) {
      // Текстовый поиск — с задержкой 300ms
      debounceTimer.current = setTimeout(() => {
        fetchExercises(search, selectedTag, selectedEquipment);
      }, 300);
    } else {
      // Пустая строка — загружаем сразу без задержки
      fetchExercises('', selectedTag, selectedEquipment);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, selectedTag, selectedEquipment]);

  // Загрузка тренажёров при первом рендере
  useEffect(() => {
    fetchEquipment();
  }, []);

  // ─── Обработчик клика по тренажёру ───────────────────────────────────────
  const handleEquipmentClick = (name: string) => {
    // Переключаемся на вкладку "Все упражнения" и фильтруем по тренажёру
    setSelectedEquipment(name);
    setActiveTab('all');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-6 text-white tracking-tight uppercase">
          База тренировок
        </h1>

        {/* Вкладки */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedEquipment(null);
            }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#6ee7b7] text-[#111318]'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Все упражнения
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'equipment'
                ? 'bg-[#6ee7b7] text-[#111318]'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Тренажёры
          </button>
        </div>

        {/* Поиск и теги — только на вкладке "Все упражнения" */}
        {activeTab === 'all' && (
          <>
            <SearchBar value={search} onChange={setSearch} />
            <TagFilter selectedTag={selectedTag} onSelect={setSelectedTag} />
            {/* Показываем активный фильтр по тренажёру если есть */}
            {selectedEquipment && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">Тренажёр:</span>
                <span className="px-3 py-1 bg-[#6ee7b7]/10 text-[#6ee7b7] rounded-full text-xs font-bold">
                  {selectedEquipment}
                </span>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  className="text-slate-500 hover:text-white text-xs transition-colors"
                >
                  ✕ сбросить
                </button>
              </div>
            )}
          </>
        )}
      </header>

      {/* ─── Вкладка: Тренажёры ─────────────────────────────────────── */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {equipment.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 py-16">
              Тренажёры не загружены
            </p>
          ) : (
            equipment.map((eq) => (
              <EquipmentCard key={eq.id} equipment={eq} onClick={handleEquipmentClick} />
            ))
          )}
        </div>
      )}

      {/* ─── Вкладка: Все упражнения ────────────────────────────────── */}
      {activeTab === 'all' && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-[#6ee7b7] mb-4" />
            <p className="font-bold tracking-widest uppercase text-xs">Загрузка данных...</p>
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-center text-slate-500 py-16">Ничего не найдено</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} onClick={setSelectedExercise} />
            ))}
          </div>
        )
      )}

      <ExerciseModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
};