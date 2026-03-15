import { TimerComponent } from './components/Timer/TimerComponent';

function App() {
  return (
    // Черный фон на весь экран, как в мобилках
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      {/* Имитация верхней шапки (Header) для понимания, что это отдельная вкладка */}
      <header className="w-full p-4 flex justify-center items-center border-b border-[#1c1c1e] pt-8">
        <h1 className="text-lg font-semibold tracking-wide">Таймер</h1>
      </header>

      {/* Контейнер самого таймера */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        <TimerComponent />
      </main>

    </div>
  );
}

export default App;