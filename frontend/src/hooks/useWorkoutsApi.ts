// src/hooks/useWorkoutsApi.ts
import { useState, useCallback } from 'react';
import type { Workout, WorkoutExercise, ParameterType, WorkoutType } from '../types/workout';
import { DEFAULT_PARAMS_FOR_TYPE } from '../types/workout';
import { apiFetch } from '../lib/api';

const BASE = '';

interface RawWorkoutExercise {
  id?: string | number;
  exerciseId?: string;
  customName?: string;
  name?: string;
  sets?: number;
  reps?: number;
  weight?: number | null;
  time?: number | null;
  distance?: number | null;
  isCustom?: boolean;
  isDone?: boolean;
  isPR?: boolean;
  parameters?: ParameterType[];
  order?: number;
  notes?: string;
}

interface RawWorkout {
  id?: string | number;
  name?: string;
  type?: WorkoutType;
  date?: string;
  color?: string;
  notes?: string;
  exercises?: RawWorkoutExercise[];
  exercise_count?: number;
}

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
function inferParameters(e: RawWorkoutExercise): ParameterType[] {
  if (Array.isArray(e.parameters) && e.parameters.length > 0) {
    return e.parameters as ParameterType[];
  }
  const inferred: ParameterType[] = [];
  if (e.sets != null && e.sets !== 0) inferred.push('sets');
  if (e.reps != null && e.reps !== 0) inferred.push('reps');
  if (e.weight != null) inferred.push('weight');
  if (e.time != null) inferred.push('time');
  if (e.distance != null) inferred.push('distance');
  return inferred;
}

function normalizeWorkout(raw: RawWorkout): Workout {
  return {
    id: raw.id?.toString() ?? '',
    name: raw.name ?? '',
    type: raw.type ?? 'custom',
    date: raw.date ?? '',
    color: raw.color ?? '',
    notes: raw.notes ?? '',
    exercises: (raw.exercises ?? []).map((e: RawWorkoutExercise, idx: number) => ({
      ...e,
      id: e.id?.toString() ?? generateExId(),
      name: e.customName || e.exerciseId || 'Упражнение',
      parameters: inferParameters(e),
      isCustom: e.isCustom ?? true,
      isDone: e.isDone ?? false,
      isPR: e.isPR ?? false,
      order: e.order ?? idx,
      weight: e.weight ?? undefined,
      time: e.time ?? undefined,
      distance: e.distance ?? undefined,
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
      const data = await apiFetch<RawWorkout[]>(`${BASE}/workouts/`);
      const normalized = data.map((raw: RawWorkout) => ({
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

  // GET /workouts/:id/
  const fetchWorkoutDetail = useCallback(async (id: string): Promise<Workout | null> => {
    try {
      const data = await apiFetch<RawWorkout>(`${BASE}/workouts/${id}/`);
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
      const raw = await apiFetch<RawWorkout>(`${BASE}/workouts/`, {
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
      const created = normalizeWorkout(raw);
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
      const raw = await apiFetch<RawWorkout>(`${BASE}/workouts/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setWorkouts(prev => prev.map(w => w.id === id ? normalizeWorkout(raw) : w));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, [workouts]);

  // DELETE /workouts/:id/
  const deleteWorkout = useCallback(async (id: string) => {
    try {
      await apiFetch(`${BASE}/workouts/${id}/`, { method: 'DELETE' });
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, []);

  // Repeat workout
  const repeatWorkout = useCallback(async (id: string): Promise<string | null> => {
    const original = workouts.find(w => w.id === id);
    if (!original) return null;

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exercises: exercises.map(({ id: _id, ...rest }) => rest as WorkoutExercise),
    };
    return addWorkout(copy);
  }, [workouts, addWorkout, fetchWorkoutDetail]);

  // Add exercise
  const addExercise = useCallback(async (workoutId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
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
  // Если targetSetsDone === undefined → классический тоггл isDone (старое поведение).
  // Если targetSetsDone задан → выставить именно это число; бэк сам пересчитает isDone.
  const toggleExerciseDone = useCallback(async (
    workoutId: string,
    exerciseId: string,
    targetSetsDone?: number,
  ) => {
    const workout = workouts.find(w => w.id === workoutId);
    const exercise = workout?.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const totalSets = Math.max(exercise.sets ?? 0, 1);

    let optimisticSetsDone: number;
    let optimisticIsDone: boolean;
    let body: Record<string, unknown>;

    if (targetSetsDone !== undefined) {
      optimisticSetsDone = Math.max(0, Math.min(targetSetsDone, totalSets));
      optimisticIsDone = optimisticSetsDone >= totalSets;
      body = { setsDone: optimisticSetsDone };
    } else {
      optimisticIsDone = !exercise.isDone;
      optimisticSetsDone = optimisticIsDone ? totalSets : 0;
      body = { isDone: optimisticIsDone };
    }

    const prevSetsDone = exercise.setsDone ?? (exercise.isDone ? totalSets : 0);
    const prevIsDone = !!exercise.isDone;

    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? {
            ...w,
            exercises: w.exercises.map(e =>
              e.id === exerciseId
                ? { ...e, isDone: optimisticIsDone, setsDone: optimisticSetsDone }
                : e
            ),
          }
        : w
    ));

    try {
      const data = await apiFetch<{ isDone: boolean; setsDone: number }>(
        `/workouts/${workoutId}/exercises/${exerciseId}/done/`,
        { method: 'PATCH', body: JSON.stringify(body) }
      );
      setWorkouts(prev => prev.map(w =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map(e =>
                e.id === exerciseId
                  ? { ...e, isDone: data.isDone, setsDone: data.setsDone }
                  : e
              ),
            }
          : w
      ));
    } catch {
      setWorkouts(prev => prev.map(w =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map(e =>
                e.id === exerciseId
                  ? { ...e, isDone: prevIsDone, setsDone: prevSetsDone }
                  : e
              ),
            }
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
