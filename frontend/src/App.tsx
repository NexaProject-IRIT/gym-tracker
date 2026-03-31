// src/App.tsx
import { useState, useEffect } from 'react';
import { WorkoutList } from './components/Workouts/WorkoutList';
import { TimerComponent } from './components/Timer/TimerComponent';
import { ExerciseGrid } from './components/KnowledgeBase/ExerciseGrid';

type AppTab = 'workouts' | 'timer' | 'knowledge';

const SIDEBAR_WIDTH = 220;

// --- Иконки ---
const IconDumbbell = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 6.5h11M6.5 17.5h11M4 9.5v5M20 9.5v5M2 11v2M22 11v2"
      stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTimer = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="13" r="8" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8"/>
    <path d="M12 9v4l2.5 2.5" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9.5 3h5M12 3v2" stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconBook = ({ active }: { active: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 1 4 17.5V4.5z" 
      stroke={active ? '#6ee7b7' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NAV_ITEMS = [
  { tab: 'workouts' as AppTab, label: 'Тренировки', icon: (a: boolean) => <IconDumbbell active={a} /> },
  { tab: 'knowledge' as AppTab, label: 'База знаний', icon: (a: boolean) => <IconBook active={a} /> },
  { tab: 'timer' as AppTab, label: 'Таймер', icon: (a: boolean) => <IconTimer active={a} /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('workouts');
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { margin: 0; background: #111318; color: #f1f5f9; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#111318' }}>
        {/* Десктопный сайдбар */}
        {!mobile && (
          <aside style={{ width: SIDEBAR_WIDTH, background: '#1a1d24', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', padding: '28px 0', position: 'sticky', top: 0, height: '100vh' }}>
            <div style={{ padding: '0 18px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <IconDumbbell active={true} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>GymLog</span>
              </div>
            </div>
            <nav style={{ flex: 1, padding: '0 10px' }}>
              {NAV_ITEMS.map(({ tab, label, icon }) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: activeTab === tab ? 'rgba(110,231,183,0.1)' : 'transparent', cursor: 'pointer', marginBottom: 2 }}>
                  {icon(activeTab === tab)}
                  <span style={{ fontSize: 14, color: activeTab === tab ? '#6ee7b7' : '#94a3b8' }}>{label}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main style={{ flex: 1, paddingBottom: mobile ? 64 : 0 }}>
          {activeTab === 'workouts' && <WorkoutList />}
          {activeTab === 'timer' && <TimerComponent />}
          {activeTab === 'knowledge' && <ExerciseGrid />}
        </main>
      </div>

      {/* Мобильный таббар */}
      {mobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(17,19,24,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', height: 64 }}>
          {NAV_ITEMS.map(({ tab, label, icon }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none' }}>
              {icon(activeTab === tab)}
              <span style={{ fontSize: 10, color: activeTab === tab ? '#6ee7b7' : '#475569' }}>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

export default App;