import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { WorkoutList } from './components/Workouts/WorkoutList';
import { ExerciseGrid } from './components/KnowledgeBase/ExerciseGrid';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AiChatPage } from './pages/AiChatPage';
import { WorkoutDetailPage } from './pages/WorkoutDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TimerProvider } from './contexts/TimerContext';
import { ThemeProvider } from './contexts/ThemeContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/welcome" replace />;
};

const PublicLanding = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/" replace /> : <LandingPage />;
};

function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; }
        .num-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-feature-settings: 'tnum' 1; }
      `}</style>

      <ThemeProvider>
        <TimerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/welcome" element={<PublicLanding />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }>
                <Route index element={<HomePage />} />
                <Route path="workouts" element={<WorkoutList />} />
                <Route path="workouts/:id" element={<WorkoutDetailPage />} />
                <Route path="knowledge" element={<ExerciseGrid />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="ai" element={<AiChatPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<Navigate to="/profile" replace />} />
                <Route path="timer" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TimerProvider>
      </ThemeProvider>
    </>
  );
}

export default App;