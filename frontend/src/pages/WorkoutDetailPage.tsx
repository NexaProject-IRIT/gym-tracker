import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkoutsContext } from '../contexts/WorkoutsContext';
import { WorkoutDetail } from '../components/Workouts/WorkoutDetail';

export const WorkoutDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    workouts, loading,
    fetchWorkouts, fetchWorkoutDetail,
    updateWorkout, deleteWorkout, repeatWorkout,
    addExercise, updateExercise, deleteExercise, toggleExerciseDone,
  } = useWorkoutsContext();

  const [detailLoaded, setDetailLoaded] = useState(false);

  useEffect(() => {
    if (!id) { navigate('/workouts', { replace: true }); return; }
    setDetailLoaded(false);
    (async () => {
      // Only fetch the list if it hasn't been loaded yet (e.g. direct URL navigation).
      // fetchWorkoutDetail upserts into the list, so the list fetch is not needed otherwise.
      if (workouts.length === 0) await fetchWorkouts();
      const w = await fetchWorkoutDetail(id);
      if (!w) navigate('/workouts', { replace: true });
      else setDetailLoaded(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync: after mutations the hook updates workouts state — derive from it
  const workout = workouts.find(w => w.id === id) ?? null;

  if (!detailLoaded || loading || !workout) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)', fontSize: 14,
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <WorkoutDetail
      workout={workout}
      onClose={() => navigate('/workouts', { replace: true })}
      onUpdate={u => updateWorkout(workout.id, u)}
      onDelete={() => { deleteWorkout(workout.id); navigate('/workouts', { replace: true }); }}
      onRepeat={() => repeatWorkout(workout.id)}
      onUpdateExercise={(exId, u) => updateExercise(workout.id, exId, u)}
      onDeleteExercise={exId => deleteExercise(workout.id, exId)}
      onAddExercise={ex => addExercise(workout.id, ex)}
      onToggleDone={exId => toggleExerciseDone(workout.id, exId)}
    />
  );
};
