// src/types/workout.ts

export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'functional' | 'custom';

export type ParameterType = 'weight' | 'reps' | 'sets' | 'time' | 'distance';

export interface ExerciseParameter {
  type: ParameterType;
  label: string;
  unit: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId?: string;      // ссылка на базу знаний (опционально для кастомных)
  customName?: string;       // кастомное название
  name: string;              // итоговое отображаемое название
  sets?: number;
  reps?: number;
  weight?: number;
  time?: number;             // в секундах
  distance?: number;         // в км
  isCustom: boolean;
  parameters: ParameterType[]; // выбранные параметры
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  date: string;              // ISO-строка
  exercises: WorkoutExercise[];
  color: string;
  notes?: string;
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Гибкость / Мобильность',
  functional: 'Функциональная',
  custom: 'Прочее',
};

export const WORKOUT_TYPE_COLORS: Record<WorkoutType, { bg: string; border: string; accent: string; tag: string }> = {
  strength: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    accent: '#3b82f6',
    tag: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },
  cardio: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    accent: '#ef4444',
    tag: 'bg-red-500/20 text-red-300 border border-red-500/30',
  },
  flexibility: {
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    accent: '#22c55e',
    tag: 'bg-green-500/20 text-green-300 border border-green-500/30',
  },
  functional: {
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.25)',
    accent: '#a855f7',
    tag: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  },
  custom: {
    bg: 'rgba(156,163,175,0.08)',
    border: 'rgba(156,163,175,0.25)',
    accent: '#9ca3af',
    tag: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  },
};

// Параметры по умолчанию для каждого типа тренировки
export const DEFAULT_PARAMS_FOR_TYPE: Record<WorkoutType, ParameterType[]> = {
  strength: ['sets', 'reps', 'weight'],
  cardio: ['time', 'distance'],
  flexibility: ['sets', 'time'],
  functional: ['sets', 'reps', 'time'],
  custom: ['sets', 'reps'],
};

export const PARAMETER_LABELS: Record<ParameterType, { label: string; unit: string; short: string }> = {
  sets: { label: 'Подходы', unit: 'подх', short: 'п' },
  reps: { label: 'Повторы', unit: 'повт', short: 'r' },
  weight: { label: 'Вес', unit: 'кг', short: 'кг' },
  time: { label: 'Время', unit: 'сек', short: 'с' },
  distance: { label: 'Дистанция', unit: 'км', short: 'км' },
};