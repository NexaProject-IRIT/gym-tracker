// src/hooks/useWorkoutsApi.ts
import { useState, useCallback } from 'react';
import type { Workout, WorkoutExercise, ParameterType } from '../types/workout';
import { DEFAULT_PARAMS_FOR_TYPE } from '../types/workout';

const BASE = '';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${getToken()}`,
  };
}

function generateExId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Frontend → Backend body
// ИСПРАВЛЕНО: добавлено поле parameters — без него бэкенд сохраняет [],
// и при следующем открытии тренировки все упражнения выглядят пустыми.
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
    parameters: e.parameters ?? [],
  };
}

// Backend → Frontend
// ИСПРАВЛЕНО: если бэкенд вернул parameters = [] (старые записи до миграции),
// пытаемся восстановить параметры из значений. Это защита для легаси-данных.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inferParameters(e: any): ParameterType[] {
  // Если parameters уже есть и не пустые — используем их
  if (Array.isArray(e.parameters) && e.parameters.length > 0) {
    return e.parameters as ParameterType[];
  }
  // Иначе выводим из наличия значений (для старых записей без parameters)
  const inferred: ParameterType[] = [];
  if (e.sets != null && e.sets !== 0) inferred.push('sets');
  if (e.reps != null && e.reps !== 0) inferred.push('reps');
  if (e.weight != null) inferred.push('weight');
  if (e.time != null) inferred.push('time');
  if (e.distance != null) inferred.push('distance');
  return inferred;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeWorkout(raw: any): Workout {
  return {
    id: raw.id?.toString() ?? '',
    name: raw.name ?? '',
    type: raw.type ?? 'custom',
    date: raw.date ?? '',
    color: raw.color ?? '',
    notes: raw.notes ?? '',
    exercises: (raw.exercises ?? []).map((e: any) => ({
      ...e,
      id: e.id?.toString() ?? generateExId(),
      name: e.customName || e.exerciseId || 'Упражнение',
      // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: inferParameters гарантирует непустой массив
      parameters: inferParameters(e),
      isCustom: e.isCustom ?? true,
    })),
  };
}

export const useWorkoutsApi = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /workouts/ — list (no exercises in response, just metadata)
  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/workouts/`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      // List response has no exercises array, just exercise_count
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = data.map((raw: any) => ({
        id: raw.id?.toString() ?? '',
        name: raw.name ?? '',
        type: raw.type ?? 'custom',
        date: raw.date ?? '',
        color: raw.color ?? '',
        exercises: [],
        exercise_count: raw.exercise_count ?? 0,
      }));
      setWorkouts(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /workouts/:id/ — detail with exercises
  const fetchWorkoutDetail = useCallback(async (id: string): Promise<Workout | null> => {
    try {
      const res = await fetch(`${BASE}/workouts/${id}/`, {
        headers: authHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const w = normalizeWorkout(data);
      // Update in local state too
      setWorkouts(prev => prev.map(existing => existing.id === id ? w : existing));
      return w;
    } catch {
      return null;
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
          notes: workout.notes,
          exercises: workout.exercises.map(serializeExercise),
        }),
      });
      if (!res.ok) {
        // ИСПРАВЛЕНО: читаем тело как текст сначала, чтобы не падать на HTML 500
        const rawBody = await res.text();
        let errMessage = `Ошибка ${res.status}`;
        try {
          const errData = JSON.parse(rawBody);
          errMessage = JSON.stringify(errData);
        } catch {
          // Бэкенд вернул HTML (500 debug page) — берём первые 200 символов для диагностики
          errMessage = `Ошибка ${res.status}: ${rawBody.slice(0, 200)}`;
        }
        throw new Error(errMessage);
      }
      const created = normalizeWorkout(await res.json());
      setWorkouts(prev => [created, ...prev]);
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      return null;
    }
  }, []);

  // PUT /workouts/:id/
  const updateWorkout = useCallback(async (id: string, updates: Partial<Workout>) => {
    try {
      const current = workouts.find(w => w.id === id);
      const body: Record<string, unknown> = {
        name: updates.name ?? current?.name,
        type: updates.type ?? current?.type,
        date: updates.date ?? current?.date,
        color: updates.color ?? current?.color,
        notes: updates.notes !== undefined ? updates.notes : (current?.notes ?? ''),
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

  // Repeat workout
  const repeatWorkout = useCallback(async (id: string): Promise<string | null> => {
    const original = workouts.find(w => w.id === id);
    if (!original) return null;

    // If original has no exercises loaded, fetch detail first
    let exercises = original.exercises;
    if (!exercises.length) {
      const detail = await fetchWorkoutDetail(id);
      if (detail) exercises = detail.exercises;
    }

    const copy: Omit<Workout, 'id'> = {
      name: original.name + ' (копия)',
      type: original.type,
      date: new Date().toISOString(),
      color: original.color,
      exercises: exercises.map(({ id: _id, ...rest }) => rest as WorkoutExercise),
    };
    return addWorkout(copy);
  }, [workouts, addWorkout, fetchWorkoutDetail]);

  // Add exercise
  const addExercise = useCallback(async (workoutId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    // Гарантируем, что parameters установлены (по умолчанию — из типа тренировки)
    const exerciseWithParams: WorkoutExercise = {
      ...exercise,
      id: generateExId(),
      parameters: exercise.parameters?.length
        ? exercise.parameters
        : DEFAULT_PARAMS_FOR_TYPE[workout.type] ?? ['sets', 'reps'],
    };
    await updateWorkout(workoutId, {
      exercises: [...workout.exercises, exerciseWithParams],
    });
  }, [workouts, updateWorkout]);

  // Update exercise
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

  // Delete exercise
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
    fetchWorkoutDetail,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    repeatWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
  };
};