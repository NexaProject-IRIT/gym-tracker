import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';
import { ExerciseModal } from './ExerciseModal';
import { ExerciseCard } from './ExerciseCard';
import { EquipmentCard } from './EquipmentCard';
import type { Exercise } from '../../types/workout';
import { authedFetch } from '../../utils/api';

interface Equipment {
  id: string;
  name: string;
  image: string | null;
}

export const ExerciseGrid = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'equipment'>('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchExercises = async (query: string, tag: string | null, equipmentFilter: string | null) => {
    setLoading(true);
    try {
      const url = query.trim() ? `/exercises/search/` : `/exercises/`;
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (tag) params.append('tag', tag.replace('#', ''));
      if (equipmentFilter) params.append('equipment', equipmentFilter);
      const res = await authedFetch(`${url}?${params.toString()}`);
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

  const fetchEquipment = async () => {
    try {
      const res = await authedFetch(`/exercises/equipment/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Ошибка загрузки тренажёров:', e);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (search.trim()) {
      debounceTimer.current = setTimeout(() => {
        fetchExercises(search, selectedTag, selectedEquipment);
      }, 300);
    } else {
      fetchExercises('', selectedTag, selectedEquipment);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search, selectedTag, selectedEquipment]);

  useEffect(() => { fetchEquipment(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await authedFetch('/exercises/');
        if (res.ok) {
          const data = await res.json();
          setAllExercises(Array.isArray(data) ? data : []);
        }
      } catch {}
    })();
  }, []);

  const handleEquipmentClick = (name: string) => {
    setSelectedEquipment(name);
    setActiveTab('all');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 16px 0',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px', letterSpacing: '-0.01em' }}>
          База тренировок
        </h1>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([['all', 'Все упражнения'], ['equipment', 'Тренажёры']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'all') setSelectedEquipment(null); }}
              style={{
                padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: activeTab === tab ? 'var(--accent)' : 'var(--border)',
                color: activeTab === tab ? 'var(--accent-fg)' : 'var(--dim)',
                transition: 'all 0.15s',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Поиск и теги */}
        {activeTab === 'all' && (
          <>
            <SearchBar value={search} onChange={setSearch} />
            <TagFilter selectedTag={selectedTag} onSelect={setSelectedTag} />
            {selectedEquipment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>Тренажёр:</span>
                <span style={{ padding: '3px 10px', background: 'var(--accent-a10)', color: 'var(--accent)', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {selectedEquipment}
                </span>
                <button
                  onClick={() => setSelectedEquipment(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 12 }}
                >
                  ✕ сбросить
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Вкладка: Тренажёры */}
      {activeTab === 'equipment' && (() => {
        const countByEquipment = allExercises.reduce<Record<string, number>>((acc, ex) => {
          if (ex.equipment) acc[ex.equipment] = (acc[ex.equipment] ?? 0) + 1;
          return acc;
        }, {});
        return (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 16px 8px' }}>
              Оборудование
            </div>
            <style>{`@media (min-width: 640px) { .eq-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (min-width: 1024px) { .eq-grid { grid-template-columns: repeat(4, 1fr) !important; } }`}</style>
            <div className="eq-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 16px 16px' }}>
              {equipment.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--faint)', padding: '48px 0' }}>
                  Тренажёры не загружены
                </p>
              ) : (
                equipment.map((eq) => (
                  <EquipmentCard
                    key={eq.id}
                    equipment={eq}
                    onClick={handleEquipmentClick}
                    exerciseCount={countByEquipment[eq.name]}
                  />
                ))
              )}
            </div>
          </>
        );
      })()}

      {/* Вкладка: Все упражнения */}
      {activeTab === 'all' && (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', opacity: 0.5 }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ marginBottom: 12, color: 'var(--accent)' }} />
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Загрузка...</p>
          </div>
        ) : exercises.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--faint)', padding: '48px 0' }}>Ничего не найдено</p>
        ) : (
          <>
            <style>{`@media (min-width: 640px) { .ex-grid { grid-template-columns: repeat(3, 1fr) !important; } } @media (min-width: 1024px) { .ex-grid { grid-template-columns: repeat(4, 1fr) !important; } }`}</style>
            <div className="ex-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              padding: '0 16px 16px',
            }}>
              {exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} onClick={setSelectedExercise} />
              ))}
            </div>
          </>
        )
      )}

      <ExerciseModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
};
