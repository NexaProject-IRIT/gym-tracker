import { useState } from 'react';
import { X } from 'lucide-react';
import type { Exercise } from '../../types/workout';

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
  zIndex?: number;
}

export const ExerciseModal = ({ exercise, onClose, zIndex = 50 }: Props) => {
  const [techniqueIdx, setTechniqueIdx] = useState(0);

  if (!exercise) return null;

  const t = exercise.images?.technique;
  const techniques: string[] = Array.isArray(t)
    ? t.filter((item): item is string => Boolean(item))
    : typeof t === 'string' && t
    ? [t]
    : [];

  // Показываем muscleMap ТОЛЬКО если поле непустое (не null, не undefined, не "")
  const muscleMap = exercise.images?.muscleMap || null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="bg-[#1a1d24] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Обложка */}
        <div className="aspect-video bg-slate-900 relative">
          {exercise.images?.cover ? (
            <img
              src={exercise.images.cover}
              alt={exercise.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 italic">
              Нет изображения
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#1a1d24] to-transparent" />
        </div>

        <div className="p-8">
          {/* Название + бейджи */}
          <div className="mb-6">
            <h2 className="text-3xl font-black text-white mb-2 leading-tight">
              {exercise.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {exercise.difficulty && (
                <span className="px-3 py-1 bg-[#6ee7b7]/10 text-[#6ee7b7] rounded-lg text-xs font-bold uppercase tracking-wider">
                  {DIFFICULTY_LABELS[exercise.difficulty] ?? exercise.difficulty}
                </span>
              )}
              {exercise.equipment && (
                <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {exercise.equipment}
                </span>
              )}
            </div>
          </div>

          {/* Описание */}
          <div className="mb-8">
            <section>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                Описание
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {exercise.description || 'Описание временно отсутствует.'}
              </p>
            </section>
          </div>

          {/* Блок 1: Техника выполнения */}
          {techniques.length > 0 && (
            <section className="mt-8 pt-8 border-t border-white/5 mb-8">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                Техника выполнения
              </h3>
              <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 relative">
                <img
                  src={techniques[techniqueIdx]}
                  alt="Техника выполнения"
                  className="w-full h-auto"
                />
                {techniques.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {techniques.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTechniqueIdx(i)}
                        className={`w-2 h-2 rounded-full transition ${
                          i === techniqueIdx ? 'bg-[#6ee7b7]' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Блок 2: Целевые мышцы (карта) — рендерим ТОЛЬКО если поле непустое */}
          {muscleMap && (
            <section className="mt-8 pt-8 border-t border-white/5 mb-8 flex flex-col items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 w-full">
                Целевые мышцы (карта)
              </h3>
              <div className="w-full flex justify-center bg-black/10 rounded-xl p-4">
                <img
                  src={muscleMap}
                  alt="Карта целевых мышц"
                  className="max-w-[400px] w-full h-auto"
                />
              </div>
            </section>
          )}

          {/* Блок 3: Теги мышц */}
          <section className="mt-8 pt-8 border-t border-white/5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
              Целевые мышцы
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(exercise.targetMuscles ?? []).map((muscle) => (
                <span
                  key={muscle}
                  className="px-3 py-1 bg-white/5 border border-white/5 rounded-md text-xs text-white"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};