// src/hooks/useWorkoutsApi.ts
import { useState, useCallback } from 'react';
import type { Workout, WorkoutExercise } from '../types/workout';

const BASE = 'http://localhost:8000';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function generateExId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      const data: Workout[] = await res.json();
      setWorkouts(data);
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
        body: JSON.stringify(workout),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const created: Workout = await res.json();
      setWorkouts(prev => [created, ...prev]);
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
      return null;
    }
  }, []);

  // PUT /workouts/:id
  const updateWorkout = useCallback(async (id: string, updates: Partial<Workout>) => {
    try {
      const res = await fetch(`${BASE}/workouts/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const updated: Workout = await res.json();
      setWorkouts(prev => prev.map(w => w.id === id ? updated : w));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, []);

  // DELETE /workouts/:id
  const deleteWorkout = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BASE}/workouts/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
    }
  }, []);

  // Повторить тренировку, создает копию через POST
  const repeatWorkout = useCallback(async (id: string): Promise<string | null> => {
    const original = workouts.find(w => w.id === id);
    if (!original) return null;
    const copy: Omit<Workout, 'id'> = {
      ...original,
      date: new Date().toISOString(),
      name: original.name + ' (копия)',
      exercises: original.exercises.map(e => ({ ...e, id: generateExId() })),
    };
    return addWorkout(copy);
  }, [workouts, addWorkout]);

  // Добавить упражнение в тренировку, через PUT всей тренировки
  const addExercise = useCallback(async (workoutId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    const updated: Partial<Workout> = {
      exercises: [...workout.exercises, { ...exercise, id: generateExId() }],
    };
    await updateWorkout(workoutId, updated);
  }, [workouts, updateWorkout]);

  // Обновить упражнение, через PUT всей тренировки
  const updateExercise = useCallback(async (
    workoutId: string,
    exerciseId: string,
    updates: Partial<WorkoutExercise>
  ) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    const updated: Partial<Workout> = {
      exercises: workout.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e),
    };
    await updateWorkout(workoutId, updated);
  }, [workouts, updateWorkout]);

  // Удалить упражнение, через PUT всей тренировки
  const deleteExercise = useCallback(async (workoutId: string, exerciseId: string) => {
    const workout = workouts.find(w => w.id === workoutId);
    if (!workout) return;
    const updated: Partial<Workout> = {
      exercises: workout.exercises.filter(e => e.id !== exerciseId),
    };
    await updateWorkout(workoutId, updated);
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