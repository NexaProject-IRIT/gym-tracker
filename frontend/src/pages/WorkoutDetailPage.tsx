import React, { useEffect, useState } from 'react';
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
    const skBase: React.CSSProperties = {
      background: 'linear-gradient(90deg, var(--surface) 25%, var(--border2) 50%, var(--surface) 75%)',
      backgroundSize: '200% 100%',
      animation: 'sk-shimmer 1.4s ease-in-out infinite',
      borderRadius: 6,
    };
    return (
      <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes sk-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        {/* шапка */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ ...skBase, width: 80, height: 20 }} />
          <div style={{ ...skBase, width: 36, height: 36, borderRadius: 10 }} />
        </div>
        {/* контент */}
        <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '28px 24px 120px' }}>
          <div style={{ ...skBase, width: 84, height: 22, borderRadius: 20, marginBottom: 14 }} />
          <div style={{ ...skBase, width: '65%', height: 28, marginBottom: 10 }} />
          <div style={{ ...skBase, width: '38%', height: 14, marginBottom: 28 }} />
          <div style={{ ...skBase, width: '100%', height: 58, borderRadius: 12, marginBottom: 24 }} />
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />
          <div style={{ ...skBase, width: '100%', height: 4, borderRadius: 2, marginBottom: 24 }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--border)', border: '1px solid var(--border)',
              marginBottom: 8,
            }}>
              <div style={{ ...skBase, width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
              <div style={{ ...skBase, width: 16, height: 14, borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...skBase, width: '55%', height: 15, marginBottom: 9 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[48, 48, 48].map((w, j) => (
                    <div key={j} style={{ ...skBase, width: w, height: 24, borderRadius: 6 }} />
                  ))}
                </div>
              </div>
              <div style={{ ...skBase, width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
            </div>
          ))}
        </div>
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
      onToggleDone={(exId, targetSetsDone) => toggleExerciseDone(workout.id, exId, targetSetsDone)}
    />
  );
};
