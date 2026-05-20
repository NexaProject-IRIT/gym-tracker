import { createContext, useContext, type ReactNode } from 'react';
import { useWorkoutsApi } from '../hooks/useWorkoutsApi';

type WorkoutsContextType = ReturnType<typeof useWorkoutsApi>;

const WorkoutsContext = createContext<WorkoutsContextType | null>(null);

export const WorkoutsProvider = ({ children }: { children: ReactNode }) => {
  const api = useWorkoutsApi();
  return <WorkoutsContext.Provider value={api}>{children}</WorkoutsContext.Provider>;
};

export const useWorkoutsContext = (): WorkoutsContextType => {
  const ctx = useContext(WorkoutsContext);
  if (!ctx) throw new Error('useWorkoutsContext вызван вне WorkoutsProvider');
  return ctx;
};
