// src/hooks/useWorkouts.ts
import { useState, useEffect, useCallback } from 'react';
import type { Workout, WorkoutExercise } from '../types/workout';

const STORAGE_KEY = 'gym_workouts_v2';

const MOCK_WORKOUTS: Workout[] = [
  {
    id: '1',
    name: 'Тридцать третья треня',
    type: 'strength',
    date: '2026-01-26T12:00:00Z',
    color: '#3b82f6',
    exercises: [
      { id: 'e1', name: 'Присед со штангой', sets: 4, reps: 8, weight: 70, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e2', name: 'Выпады с гантелями', sets: 3, reps: 12, weight: 10, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e3', name: 'Разгибание ног', sets: 3, reps: 12, weight: 45, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e4', name: 'Подъем на икры', sets: 4, reps: 15, weight: 30, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e5', name: 'Жим штанги стоя', sets: 4, reps: 10, weight: 30, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e6', name: 'Разведение гантелей', sets: 3, reps: 12, weight: 6, isCustom: false, parameters: ['sets', 'reps', 'weight'] },
      { id: 'e7', name: 'Планка', sets: 3, time: 60, weight: 5, isCustom: false, parameters: ['sets', 'time', 'weight'] },
    ],
  },
  {
    id: '2',
    name: 'Утренняя пробежка',
    type: 'cardio',
    date: '2026-01-28T08:30:00Z',
    color: '#ef4444',
    exercises: [
      { id: 'e8', name: 'Бег на улице', time: 1200, distance: 5.2, isCustom: false, parameters: ['time', 'distance'] },
    ],
  },
  {
    id: '3',
    name: 'Йога утром',
    type: 'flexibility',
    date: '2026-02-01T07:00:00Z',
    color: '#22c55e',
    exercises: [
      { id: 'e9', name: 'Поза собаки мордой вниз', sets: 3, time: 30, isCustom: false, parameters: ['sets', 'time'] },
      { id: 'e10', name: 'Поза воина I', sets: 2, time: 45, isCustom: false, parameters: ['sets', 'time'] },
    ],
  },
];

function generateId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateExId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_WORKOUTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  }, []);

  const addWorkout = useCallback((workout: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = { ...workout, id: generateId() };
    setWorkouts(prev => [newWorkout, ...prev]);
    return newWorkout.id;
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const repeatWorkout = useCallback((id: string) => {
    const original = workouts.find(w => w.id === id);
    if (!original) return;
    const copy: Workout = {
      ...original,
      id: generateId(),
      date: new Date().toISOString(),
      name: original.name + ' (копия)',
      exercises: original.exercises.map(e => ({ ...e, id: generateExId() })),
    };
    setWorkouts(prev => [copy, ...prev]);
    return copy.id;
  }, [workouts]);

  const addExercise = useCallback((workoutId: string, exercise: Omit<WorkoutExercise, 'id'>) => {
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: [...w.exercises, { ...exercise, id: generateExId() }] }
        : w
    ));
  }, []);

  const updateExercise = useCallback((workoutId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e) }
        : w
    ));
  }, []);

  const deleteExercise = useCallback((workoutId: string, exerciseId: string) => {
    setWorkouts(prev => prev.map(w =>
      w.id === workoutId
        ? { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) }
        : w
    ));
  }, []);

  return {
    workouts,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    repeatWorkout,
    addExercise,
    updateExercise,
    deleteExercise,
  };
};