import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkoutsApi } from '../hooks/useWorkoutsApi';
import { WorkoutDetail } from '../components/Workouts/WorkoutDetail';

export const WorkoutDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    workouts, loading,
    fetchWorkouts, fetchWorkoutDetail,
    updateWorkout, deleteWorkout, repeatWorkout,
    addExercise, updateExercise, deleteExercise,
  } = useWorkoutsApi();

  const [detailLoaded, setDetailLoaded] = useState(false);

  useEffect(() => {
    if (!id) { navigate('/workouts', { replace: true }); return; }
    setDetailLoaded(false);
    (async () => {
      await fetchWorkouts();
      const w = await fetchWorkoutDetail(id);
      if (!w) navigate('/workouts', { replace: true });
      else setDetailLoaded(true);
    })();
  }, [id]);

  // Sync: after mutations the hook updates workouts state — derive from it
  const workout = workouts.find(w => w.id === id) ?? null;

  if (!detailLoaded || loading || !workout) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#111318',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#6ee7b7', fontSize: 14,
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <WorkoutDetail
      workout={workout}
      onClose={() => navigate('/workouts')}
      onUpdate={u => updateWorkout(workout.id, u)}
      onDelete={() => { deleteWorkout(workout.id); navigate('/workouts'); }}
      onRepeat={() => repeatWorkout(workout.id)}
      onUpdateExercise={(exId, u) => updateExercise(workout.id, exId, u)}
      onDeleteExercise={exId => deleteExercise(workout.id, exId)}
      onAddExercise={ex => addExercise(workout.id, ex)}
    />
  );
};
