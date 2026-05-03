import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { WorkoutList } from './components/Workouts/WorkoutList';
import { ExerciseGrid } from './components/KnowledgeBase/ExerciseGrid';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AiChatPage } from './pages/AiChatPage';
import { WorkoutDetailPage } from './pages/WorkoutDetailPage';
import { TimerProvider } from './contexts/TimerContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { margin: 0; background: #111318; color: #f1f5f9; }
      `}</style>

      <TimerProvider>
        <BrowserRouter>
          <Routes>
            {/* Публичные страницы */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Защищённые страницы */}
            <Route element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<HomePage />} />
              <Route path="workouts" element={<WorkoutList />} />
              <Route path="workouts/:id" element={<WorkoutDetailPage />} />
              <Route path="knowledge" element={<ExerciseGrid />} />
              <Route path="ai" element={<AiChatPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<Navigate to="/profile" replace />} />
              <Route path="timer" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </>
  );
}

export default App;