import type { WorkoutType } from '../types/workout';

export const WORKOUT_TYPE_ICON_PATHS: Record<WorkoutType, string[]> = {
  strength:    ['M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2'],
  cardio:      ['M3 12h4l3-8 4 16 3-8h4'],
  flexibility: ['M12 3c-1.5 4-4 6-4 9a4 4 0 008 0c0-3-2.5-5-4-9z', 'M12 15v6M9 18h6'],
  functional:  ['M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  custom:      ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
};
