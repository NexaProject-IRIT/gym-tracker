<<<<<<< HEAD
import { useState, useMemo } from 'react';
import exercisesData from '../../data/exercises.json'; 
import type { Exercise } from '../../types/workout'; 

// 1. СЛОВАРЬ КАРТИНОК ДЛЯ ТРЕНАЖЕРОВ
// Добавляй сюда названия тренажеров точно так же, как они написаны в JSON
const EQUIPMENT_IMAGES: Record<string, string> = {
  "Штанга": "/images/equipment/barbell.jpg",
  "Гантели": "/images/equipment/dumbbells.jpg",
  "Тренажер Баттерфляй": "/images/equipment/butterfly.jpg",
  "Машина Смита": "/images/equipment/smith.jpg",
  "Кроссовер": "/images/equipment/crossover.jpg",
  "Скамья": "/images/equipment/bench.jpg"
};

const TAGS = ['#ноги', '#спина', '#грудь', '#плечи', '#руки', '#пресс', '#кардио'];

export const ExerciseGrid = () => {
=======
import { useState, useMemo, useEffect } from 'react';
import type { Exercise } from '../../types/workout';
import { Search, Loader2, X } from 'lucide-react';

const TAGS = ['#ноги', '#спина', '#грудь', '#плечи', '#руки', '#пресс', '#кардио'];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

interface Equipment {
  id: string;
  name: string;
  description: string;
  image: string | null;
  tags: string[];
}

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

export const ExerciseGrid = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
>>>>>>> main
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'equipment'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
<<<<<<< HEAD
  const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0);

  const exercises = exercisesData as Exercise[];

  const equipmentList = useMemo(() => {
    const uniqueNames = Array.from(new Set(exercises.map(ex => ex.equipment)));
    return uniqueNames
      .map(name => {
        const customImage = EQUIPMENT_IMAGES[name];
        const firstExercise = exercises.find(ex => ex.equipment === name);
        return {
          name,
          image: customImage || firstExercise?.images.cover || '' 
        };
      })
      .filter(e => e.name !== 'Собственный вес');
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || 
                            ex.equipment.toLowerCase().includes(search.toLowerCase()) ||
                            ex.targetMuscles.some(m => m.toLowerCase().includes(search.toLowerCase()));
      
      const matchesTag = selectedTag ? ex.tags.includes(selectedTag.replace('#', '')) : true;
      const matchesEquip = selectedEquipment ? ex.equipment === selectedEquipment : true;

=======
  const [techniqueIdx, setTechniqueIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const headers: HeadersInit = { Authorization: `Token ${getToken()}` };
      try {
        const [exRes, eqRes] = await Promise.all([
          fetch('/exercises/', { headers }),
          fetch('/exercises/equipment/', { headers }),
        ]);
        if (!exRes.ok) throw new Error(`Упражнения: ${exRes.status}`);
        const exData: Exercise[] = await exRes.json();
        setExercises(Array.isArray(exData) ? exData : []);

        if (eqRes.ok) {
          const eqData: Equipment[] = await eqRes.json();
          setEquipmentList(Array.isArray(eqData) ? eqData : []);
        }
      } catch (e) {
        console.error('Ошибка в базе тренировок:', e);
        setError('Не удалось загрузить базу упражнений. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase();
    return exercises.filter(ex => {
      const matchesSearch = !q ||
        ex.name.toLowerCase().includes(q) ||
        (ex.equipment || '').toLowerCase().includes(q) ||
        (ex.targetMuscles || []).some(m => m.toLowerCase().includes(q));
      const matchesTag = selectedTag ? (ex.tags || []).includes(selectedTag.replace('#', '')) : true;
      const matchesEquip = selectedEquipment ? ex.equipment === selectedEquipment : true;
>>>>>>> main
      return matchesSearch && matchesTag && matchesEquip;
    });
  }, [search, selectedTag, selectedEquipment, exercises]);

<<<<<<< HEAD
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-6 text-white tracking-tight">База знаний</h1>

        {/* Поисковик */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Поиск тренажера, упражнения или мышц..." 
=======
  const techniqueArr = (ex: Exercise | null): string[] => {
    if (!ex) return [];
    const t = ex.images?.technique;
    if (Array.isArray(t)) return t.filter(Boolean);
    if (typeof t === 'string' && t) return [t];
    return [];
  };

  const openExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setTechniqueIdx(0);
  };

  const techniques = techniqueArr(selectedExercise);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-slate-200">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-6 text-white tracking-tight">База тренировок</h1>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Поиск тренажера, упражнения или мышц..."
>>>>>>> main
            className="w-full bg-[#1a1d24] border border-white/10 rounded-2xl px-12 py-4 outline-none focus:border-[#6ee7b7] transition-all text-lg shadow-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
<<<<<<< HEAD
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30"> 🔍 </span>
        </div>

        {/* Облако тегов (Хэштеги по ТЗ) */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(tag => (
            <button 
=======
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 opacity-50" />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(tag => (
            <button
>>>>>>> main
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedTag === tag ? 'bg-[#6ee7b7] text-[#111318] border-[#6ee7b7]' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

<<<<<<< HEAD
        {/* Переключатель вкладок (Все / Тренажеры) */}
        <div className="flex bg-[#1a1d24] p-1.5 rounded-2xl border border-white/5 w-full md:w-fit shadow-inner">
          <button 
            onClick={() => { setActiveTab('all'); setSelectedEquipment(null); }}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-[#6ee7b7] text-[#111318] shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >ВСЕ УПРАЖНЕНИЯ</button>
          <button 
=======
        <div className="flex bg-[#1a1d24] p-1.5 rounded-2xl border border-white/5 w-full md:w-fit shadow-inner">
          <button
            onClick={() => { setActiveTab('all'); setSelectedEquipment(null); }}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-[#6ee7b7] text-[#111318] shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >ВСЕ УПРАЖНЕНИЯ</button>
          <button
>>>>>>> main
            onClick={() => { setActiveTab('equipment'); setSelectedEquipment(null); }}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'equipment' ? 'bg-[#6ee7b7] text-[#111318] shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >ТРЕНАЖЕРЫ</button>
        </div>
      </header>

<<<<<<< HEAD
      {/* КОНТЕНТ: ВКЛАДКА ТРЕНАЖЕРЫ */}
      {activeTab === 'equipment' && !selectedEquipment ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {equipmentList.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(equip => (
            <div 
              key={equip.name}
              onClick={() => setSelectedEquipment(equip.name)}
              className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#6ee7b7]/50 transition-all shadow-lg"
            >
              <div className="aspect-square bg-slate-800 relative overflow-hidden">
                <img src={equip.image} alt={equip.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-black text-white text-sm leading-tight uppercase">{equip.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* КОНТЕНТ: СПИСОК УПРАЖНЕНИЙ (СЕТКА) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedEquipment && (
            <div className="col-span-full mb-2 flex items-center gap-2 text-[#6ee7b7]">
              <button onClick={() => setSelectedEquipment(null)} className="font-bold hover:underline">← Назад к тренажерам</button>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold">{selectedEquipment}</span>
            </div>
          )}
          {filteredExercises.map(ex => (
            <div 
              key={ex.id} 
              onClick={() => { setSelectedExercise(ex); setCurrentGalleryIdx(0); }}
              className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:translate-y-[-4px] transition-all"
            >
              <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                <img src={ex.images.cover} alt={ex.name} className="w-full h-full object-cover opacity-80" />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                   <span className="text-[10px] font-black text-[#6ee7b7] uppercase tracking-tighter">{ex.targetMuscles[0]}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white mb-1 group-hover:text-[#6ee7b7] transition-colors">{ex.name}</h3>
                <p className="text-slate-500 text-[11px] uppercase font-bold tracking-widest">{ex.equipment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛКА ПОЛНОЙ СТРАНИЦЫ (ТЗ Пункты 46-50) */}
      {selectedExercise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0b0e]/95 backdrop-blur-2xl">
          <div className="bg-[#16181d] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 shadow-2xl relative">
            
            <button onClick={() => setSelectedExercise(null)} className="sticky top-6 float-right mr-6 z-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-all">✕</button>

            <div className="p-6 md:p-12">
              <div className="flex flex-col lg:flex-row gap-12">
                
                {/* Левая часть: Описание и Галерея */}
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-white mb-4 leading-none">{selectedExercise.name}</h2>
                  <div className="inline-block px-4 py-1 rounded-full bg-[#6ee7b7]/10 border border-[#6ee7b7]/20 text-[#6ee7b7] text-xs font-black uppercase mb-8">
                    {selectedExercise.equipment}
                  </div>

                  <section className="mb-10">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Как настроить и выполнять</h4>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-slate-300 leading-relaxed italic">
                      {selectedExercise.description}
                    </div>
                  </section>

                  {/* Галерея (Карусель) */}
                  <section>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Галерея техники</h4>
                    <div className="space-y-4">
                      <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10">
                        <img 
                          src={selectedExercise.images.technique[currentGalleryIdx] || selectedExercise.images.cover} 
                          className="w-full h-full object-cover" 
                          alt="Техника"
                        />
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {selectedExercise.images.technique.map((img, i) => (
                          <button 
                            key={i} 
                            onClick={() => setCurrentGalleryIdx(i)}
                            className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${currentGalleryIdx === i ? 'border-[#6ee7b7] scale-95' : 'border-transparent opacity-40'}`}
                          >
                            <img src={img} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>

                {/* Правая часть: Силуэт и Мышцы */}
                <div className="lg:w-80">
                  <div className="bg-[#1a1d24] rounded-[2rem] p-8 border border-white/5 text-center sticky top-0">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Карта целевых мышц</h4>
                    
                    <div className="relative mb-8">
                      {/* 2D Силуэт с выделением мышц */}
                      <img 
                        src={selectedExercise.images.muscleMap} 
                        className="w-full max-h-72 object-contain drop-shadow-[0_0_20px_rgba(110,231,183,0.3)]" 
                        alt="Силуэт"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedExercise.targetMuscles.map(m => (
                        <span key={m} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
=======
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="w-10 h-10 animate-spin text-[#6ee7b7] mb-4" />
          <p className="font-bold tracking-widest uppercase text-xs">Загрузка базы...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold hover:bg-red-500/30 transition"
          >
            Перезагрузить
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'equipment' && !selectedEquipment ? (
            equipmentList.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {equipmentList.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(equip => (
                  <div
                    key={equip.id}
                    onClick={() => setSelectedEquipment(equip.name)}
                    className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#6ee7b7]/50 transition-all shadow-lg"
                  >
                    <div className="aspect-square bg-slate-800 relative overflow-hidden">
                      {equip.image ? (
                        <img src={equip.image} alt={equip.name}
                          className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <span className="text-white/20 uppercase text-[10px] font-bold text-center px-2">Без изображения</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <h3 className="font-black text-white text-sm leading-tight uppercase">{equip.name}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 italic">
                Тренажёры пока не загружены.
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedEquipment && (
                <div className="col-span-full mb-2 flex items-center gap-2 text-[#6ee7b7]">
                  <button onClick={() => setSelectedEquipment(null)} className="font-bold hover:underline">← Назад к тренажерам</button>
                  <span className="text-slate-600">/</span>
                  <span className="text-white font-bold">{selectedEquipment}</span>
                </div>
              )}
              {filteredExercises.length > 0 ? (
                filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => openExercise(ex)}
                    className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:translate-y-[-4px] transition-all"
                  >
                    <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                      {ex.images?.cover ? (
                        <img src={ex.images.cover} alt={ex.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 italic text-xs">
                          Нет фото
                        </div>
                      )}
                    </div>
                    <div className="p-5 text-center">
                      <h3 className="font-bold text-white mb-1 group-hover:text-[#6ee7b7] transition-colors">{ex.name}</h3>
                      <p className="text-slate-500 text-[11px] uppercase font-bold tracking-widest">{ex.equipment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-slate-500 italic">Упражнения не найдены...</div>
              )}
            </div>
          )}
        </>
      )}

      {selectedExercise && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-[#1a1d24] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="aspect-video bg-slate-900 relative">
              {selectedExercise.images?.cover ? (
                <img src={selectedExercise.images.cover} alt={selectedExercise.name}
                  className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 italic">Нет изображения</div>
              )}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#1a1d24] to-transparent" />
            </div>

            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-white mb-2 leading-tight">{selectedExercise.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.difficulty && (
                    <span className="px-3 py-1 bg-[#6ee7b7]/10 text-[#6ee7b7] rounded-lg text-xs font-bold uppercase tracking-wider">
                      {DIFFICULTY_LABELS[selectedExercise.difficulty] ?? selectedExercise.difficulty}
                    </span>
                  )}
                  {selectedExercise.equipment && (
                    <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {selectedExercise.equipment}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <section>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Описание</h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                    {selectedExercise.description || 'Описание временно отсутствует.'}
                  </p>
                </section>
                <section>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Целевые мышцы</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedExercise.targetMuscles ?? []).map(muscle => (
                      <span key={muscle} className="px-3 py-1 bg-white/5 border border-white/5 rounded-md text-xs text-white">
                        {muscle}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {techniques.length > 0 && (
                <section className="mt-8 pt-8 border-t border-white/5">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Техника выполнения</h3>
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 relative">
                    <img src={techniques[techniqueIdx]} alt="Техника выполнения" className="w-full h-auto" />
                    {techniques.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {techniques.map((_, i) => (
                          <button key={i} onClick={() => setTechniqueIdx(i)}
                            className={`w-2 h-2 rounded-full transition ${i === techniqueIdx ? 'bg-[#6ee7b7]' : 'bg-white/30'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}
>>>>>>> main
            </div>
          </div>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> main
