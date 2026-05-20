// src/hooks/useWorkoutsApi.ts
import { useState, useCallback } from 'react';
import type { Workout, WorkoutExercise, ParameterType } from '../types/workout';
import { DEFAULT_PARAMS_FOR_TYPE } from '../types/workout';
import { authedFetch } from '../utils/api';

const BASE = '';

function generateExId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Frontend → Backend body
// ИСПРАВЛЕНО: добавлено поле parameters — без него бэкенд сохраняет [],
// и при следующем открытии тренировки все упражнения выглядят пустыми.
function serializeExercise(e: WorkoutExercise, idx?: number) {
  return {
    uid: e.id,
    exerciseId: e.exerciseId ?? '',
    customName: e.customName ?? e.name ?? '',
    sets: e.sets ?? 0,
    reps: e.reps ?? 0,
    weight: e.weight ?? null,
    time: e.time ?? null,
    distance: e.distance ?? null,
    isCustom: e.isCustom,
    isDone: e.isDone ?? false,
    parameters: e.parameters ?? [],
    order: idx !== undefined ? idx : (e.order ?? 0),
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
    exercises: (raw.exercises ?? []).map((e: any, idx: number) => ({
      ...e,
      id: e.id?.toString() ?? generateExId(),
      name: e.customName || e.exerciseId || 'Упражнение',
      parameters: inferParameters(e),
      isCustom: e.isCustom ?? true,
      isDone: e.isDone ?? false,
      order: e.order ?? idx,
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
      const res = await authedFetch(`${BASE}/workouts/`);
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
      const res = await authedFetch(`${BASE}/workouts/${id}/`);
      if (!res.ok) return null;
      const data = await res.json();
      const w = normalizeWorkout(data);
      setWorkouts(prev => {
        const exists = prev.some(existing => existing.id === id);
        return exists ? prev.map(existing => existing.id === id ? w : existing) : [...prev, w];
      });
      return w;
    } catch {
      return null;
    }
  }, []);

  // POST /workouts/
  const addWorkout = useCallback(async (workout: Omit<Workout, 'id'>): Promise<string | null> => {
    try {
      const res = await authedFetch(`${BASE}/workouts/`, {
        method: 'POST',
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
        const rawBody = await res.text();
        let errMessage = `Ошибка ${res.status}`;
        try {
          const errData = JSON.parse(rawBody);
          errMessage = errData.detail || errData.error || errData.message || errMessage;
        } catch { /* HTML 500 — оставляем "Ошибка N" */ }
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
        body.exercises = updates.exercises.map((e, idx) => serializeExercise(e, idx));
      } else if (current?.exercises) {
        body.exercises = current.exercises.map((e, idx) => serializeExercise(e, idx));
      }
      const res = await authedFetch(`${BASE}/workouts/${id}/`, {
        method: 'PUT',
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
      const res = await authedFetch(`${BASE}/workouts/${id}/`, {
        method: 'DELETE',
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
      date: new Date().toLocaleDateString('en-CA'),
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

  // PATCH /workouts/:workoutId/exercises/:exerciseId/done/
  const toggleExerciseDone = useCallback(async (workoutId: string, exerciseId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    const exercise = workout?.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    const newIsDone = !exercise.isDone;
    // Оптимистичное обновление
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, isDone: newIsDone } : e) }
        : w
    ));
    try {
      const res = await authedFetch(`/workouts/${workoutId}/exercises/${exerciseId}/done/`, {
        method: 'PATCH',
        body: JSON.stringify({ isDone: newIsDone }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkouts(prev => prev.map(w =>
          w.id === workoutId
            ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, isDone: data.isDone } : e) }
            : w
        ));
      } else {
        // Откатываем
        setWorkouts(prev => prev.map(w =>
          w.id === workoutId
            ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, isDone: !newIsDone } : e) }
            : w
        ));
      }
    } catch {
      setWorkouts(prev => prev.map(w =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, isDone: !newIsDone } : e) }
          : w
      ));
    }
  }, [workouts]);

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
    toggleExerciseDone,
  };
};