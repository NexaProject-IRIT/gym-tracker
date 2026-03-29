import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { WorkoutList } from './components/Workouts/WorkoutList';
import { TimerComponent } from './components/Timer/TimerComponent';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="workouts" element={<WorkoutList />} />
          <Route path="timer" element={<TimerComponent />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;