import React, { useState } from 'react';
import type { WorkoutType, WorkoutExercise } from '../../../types/workout';
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPE_LABELS } from '../../../types/workout';
import { AccountStep } from './AccountStep';
import { ExerciseStep, type DraftExercise } from './ExerciseStep';

interface Props {
  onSave: (data: { name: string; type: WorkoutType; date: string; notes: string; exercises: Omit<WorkoutExercise, 'id'>[] }) => void;
  onClose: () => void;
}

type Step = 'type' | 'exercises';

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WorkoutForm: React.FC<Props> = ({ onSave, onClose }) => {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);

  const c = selectedType ? WORKOUT_TYPE_COLORS[selectedType] : null;

  const selectType = (type: WorkoutType) => {
    setSelectedType(type);
    const d = new Date();
    setWorkoutName(`${WORKOUT_TYPE_LABELS[type]} ${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}`);
    setStep('exercises');
  };

  const handleSave = () => {
    if (!selectedType || !workoutName.trim()) return;
    onSave({
      name: workoutName.trim(), type: selectedType, date: workoutDate, notes: notes.trim(),
      exercises: exercises.map(e => ({
        name: e.name,
        exerciseId: e.exerciseId,
        isCustom: e.isCustom,
        parameters: e.parameters,
        sets: e.parameters.includes('sets') && e.sets ? parseInt(e.sets) : undefined,
        reps: e.parameters.includes('reps') && e.reps ? parseInt(e.reps) : undefined,
        weight: e.parameters.includes('weight') && e.weight ? parseFloat(e.weight) : undefined,
        time: e.parameters.includes('time') && e.time ? parseInt(e.time) : undefined,
        distance: e.parameters.includes('distance') && e.distance ? parseFloat(e.distance) : undefined,
      })),
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 16px', position: 'sticky', top: 0,
        background: 'var(--bg)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)', zIndex: 10,
      }}>
        <button
          onClick={step === 'type' ? onClose : () => setStep('type')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '6px 0' }}
        >
          <IconBack /> {step === 'type' ? 'Отмена' : 'Назад'}
        </button>
        <h2 style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16, margin: 0 }}>
          {step === 'type' ? 'Новая тренировка' : 'Упражнения'}
        </h2>
        <div style={{ width: 80 }} />
      </div>

      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', padding: '28px 24px 120px', flex: 1 }}>
        {step === 'type' && <AccountStep onSelect={selectType} />}

        {step === 'exercises' && selectedType && (
          <ExerciseStep
            selectedType={selectedType}
            workoutName={workoutName}
            onWorkoutNameChange={setWorkoutName}
            workoutDate={workoutDate}
            onWorkoutDateChange={setWorkoutDate}
            notes={notes}
            onNotesChange={setNotes}
            exercises={exercises}
            setExercises={setExercises}
          />
        )}
      </div>

      {step === 'exercises' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 24px 28px',
          background: 'linear-gradient(to top, var(--bg) 50%, transparent)',
          zIndex: 20,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button
              onClick={handleSave}
              disabled={!workoutName.trim()}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: workoutName.trim() && c ? `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` : 'var(--border)',
                color: workoutName.trim() ? '#0a0a0a' : 'var(--ghost)',
                fontWeight: 700, fontSize: 14, transition: 'opacity 0.15s',
                boxShadow: workoutName.trim() && c ? `0 4px 20px ${c.accent}33` : 'none',
              }}
            >
              Сохранить тренировку
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
