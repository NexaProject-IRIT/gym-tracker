// src/hooks/useWorkoutsApi.ts
import { useState, useCallback } from 'react';
import type { Workout, WorkoutExercise } from '../types/workout';

// Пустой BASE — запросы идут через Vite proxy (настроенный в vite.config.ts)
const BASE = '';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    // DRF TokenAuthentication требует "Token <token>", не "Bearer"
    Authorization: `Token ${getToken()}`,
  };
}

function generateExId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Маппинг WorkoutExercise (фронт) → тело запроса (бэк)
function serializeExercise(e: WorkoutExercise) {
  return {
    exerciseId: e.exerciseId ?? '',
    customName: e.customName ?? e.name ?? '',
    sets: e.sets ?? 0,
    reps: e.reps ?? 0,
    weight: e.weight ?? null,
    time: e.time ?? null,
    distance: e.distance ?? null,
    isCustom: e.isCustom,
  };
}

// Нормализация ответа бэка → тип Workout.
// Бэк возвращает { customName, exerciseId, isCustom }, а фронт везде читает ex.name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWorkout(raw: any): Workout {
  return {
    ...raw,
    // id приходит как uid (строка-uuid) из бэка — оставляем как есть
    exercises: (raw.exercises ?? []).map((e: any) => ({
      ...e,
      // name — отображаемое имя для UI
      name: e.customName || e.exerciseId || 'Упражнение',
      // parameters бэк не возвращает в list-ответе, ставим пустой массив
      parameters: e.parameters ?? [],
    })),
  };
}

export const useWorkoutsApi = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /workouts/
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/workouts/`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      setWorkouts(data.map(normalizeWorkout));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /workouts/
  const addWorkout = useCallback(async (workout: Omit<Workout, 'id'>): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE}/workouts/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: workout.name,
          type: workout.type,
          date: workout.date,
          color: workout.color,
          exercises: workout.exercises.map(serializeExercise),
        }),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const created = normalizeWorkout(await res.json());
      setWorkouts(prev => [created, ...prev]);
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      return null;
    }
  }, []);

  // PUT /workouts/:id/  (trailing slash обязателен для Django Router)
  const updateWorkout = useCallback(async (id: string, updates: Partial<Workout>) => {
    try {
      // Берём текущую тренировку из стейта, чтобы PUT был полным (бэк требует все поля)
      const current = workouts.find(w => w.id === id);
      const body: Record<string, unknown> = {
        name: updates.name ?? current?.name,
        type: updates.type ?? current?.type,
        date: updates.date ?? current?.date,
        color: updates.color ?? current?.color,
      };
      if (updates.exercises !== undefined) {
        body.exercises = updates.exercises.map(serializeExercise);
      } else if (current?.exercises) {
        body.exercises = current.exercises.map(serializeExercise);
      }
      const res = await fetch(`${BASE}/workouts/${id}/`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const updated = normalizeWorkout(await res.json());
      setWorkouts(prev => prev.map(w => w.id === id ? updated : w));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, [workouts]);

  // DELETE /workouts/:id/
  const deleteWorkout = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BASE}/workouts/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, []);

  // Повторить тренировку — создаёт копию через POST
  const repeatWorkout = useCallback(async (id: string): Promise<string | null> => {
    const original = workouts.find(w => w.id === id);
    if (!original) return null;
    const copy: Omit<Workout, 'id'> = {
      ...original,
      date: new Date().toISOString(),
      name: original.name + ' (копия)',
      // id у упражнений бэк назначит сам, здесь нужны только данные
      exercises: original.exercises.map(({ id: _id, ...rest }) => rest as WorkoutExercise),
    };
    return addWorkout(copy);
  }, [workouts, addWorkout]);

  // Добавить упражнение — PUT всей тренировки с новым упражнением в конце
  const addExercise = useCallback(async (workoutId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    await updateWorkout(workoutId, {
      exercises: [...workout.exercises, { ...exercise, id: generateExId() }],
    });
  }, [workouts, updateWorkout]);

  // Обновить упражнение — PUT всей тренировки с изменённым упражнением
  const updateExercise = useCallback(async (
    workoutId: string,
    exerciseId: string,
    updates: Partial<WorkoutExercise>
  ) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    await updateWorkout(workoutId, {
      exercises: workout.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e),
    });
  }, [workouts, updateWorkout]);

  // Удалить упражнение — PUT всей тренировки без удалённого упражнения
  const deleteExercise = useCallback(async (workoutId: string, exerciseId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    await updateWorkout(workoutId, {
      exercises: workout.exercises.filter(e => e.id !== exerciseId),
    });
  }, [workouts, updateWorkout]);

  return {
    workouts,
    loading,
    error,
    fetchWorkouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    repeatWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
  };
};