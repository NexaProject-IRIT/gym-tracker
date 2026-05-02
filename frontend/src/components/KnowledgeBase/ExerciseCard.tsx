import type { Exercise } from '../../types/workout';

interface Props {
  exercise: Exercise;
  onClick: (ex: Exercise) => void;
}

export const ExerciseCard = ({ exercise, onClick }: Props) => (
  <div
    onClick={() => onClick(exercise)}
    className="group bg-[#1a1d24] rounded-3xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#6ee7b7]/50 transition-all shadow-lg hover:-translate-y-1"
  >
    <div className="aspect-[4/3] bg-slate-800 relative">
      {exercise.images?.cover ? (
        <img 
          src={exercise.images.cover} 
          alt={exercise.name} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-600 italic text-xs">
          Нет фото
        </div>
      )}
    </div>
    <div className="p-5 text-center">
      <h3 className="font-bold text-white group-hover:text-[#6ee7b7] transition-colors">
        {exercise.name}
      </h3>
      <p className="text-slate-500 text-[10px] uppercase font-bold mt-1">
        {exercise.equipment}
      </p>
    </div>
  </div>
);
