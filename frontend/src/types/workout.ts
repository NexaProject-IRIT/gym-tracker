// src/types/workout.ts

// Типы тренировок согласно ТЗ (п. 24) [cite: 24, 58]
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'functional' | 'custom';

// Типы параметров для упражнений (п. 32) [cite: 32, 55]
export type ParameterType = 'weight' | 'reps' | 'sets' | 'time' | 'distance';

export interface ExerciseParameter {
  type: ParameterType;
  label: string;
  unit: string;
}

/**
 * Интерфейс для Базы знаний (справочника) [cite: 54, 55]
 */
export interface Exercise {
  id: string;
  name: string;
  description: string;
  equipment: string;
  targetMuscles: string[];
  difficulty?: string;
  tags: string[];
  parameters: ExerciseParameter[];
  images: {
    cover: string;
    technique: string[]; // Галерея (карусель) из ТЗ (п. 46) [cite: 46, 55]
    muscleMap: string;   // 2D силуэт мышц (п. 46) [cite: 46, 55]
  };
}

/**
 * Интерфейс упражнения внутри конкретной тренировки [cite: 57, 58]
 */
export interface WorkoutExercise {
  id: string;
  exerciseId?: string;      // Ссылка на ID из базы знаний [cite: 57]
  customName?: string;      // Кастомное название (п. 20) [cite: 20, 57]
  name: string;             // Отображаемое имя
  sets?: number;
  reps?: number;
  notes?: string;
  weight?: number;
  time?: number;            // В секундах
  distance?: number;        // В км
  isCustom: boolean;
  isDone?: boolean;
  parameters: ParameterType[];
  order?: number;
}

/**
 * Интерфейс самой тренировки [cite: 56, 57]
 */
export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  date: string;             // ISO-строка (п. 38) [cite: 38, 56]
  exercises: WorkoutExercise[];
  color: string;            // Цвет заливки в списке (п. 14) [cite: 14, 57]
  notes?: string;
  exercise_count?: number;  // Только в ответе списка (детали без exercises)
}

// --- Справочные данные для UI ---

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Силовая',
  cardio: 'Кардио',
  flexibility: 'Гибкость / Мобильность',
  functional: 'Функциональная',
  custom: 'Прочее',
};

// Цветовая схема согласно ТЗ (п. 14, 24) [cite: 14, 24]
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

// Параметры по умолчанию (п. 31) [cite: 31]
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
