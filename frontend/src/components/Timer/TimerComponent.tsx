import React, { useState, useEffect, useRef } from 'react';

type Tab = 'stopwatch' | 'timer';

// Оптимизированная iOS-карусель (мягкий скролл + глобальный Drag-and-Drop)
const ScrollPicker = ({ value, setValue, max, label }: { value: number, setValue: (v: number) => void, max: number, label: string }) => {
  const ITEM_HEIGHT = 64; 
  const items = Array.from({ length: max + 1 }, (_, i) => i);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isMounting = useRef(true);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  useEffect(() => {
    if (containerRef.current) {
      isMounting.current = true;
      containerRef.current.scrollTop = value * ITEM_HEIGHT;
      setTimeout(() => { isMounting.current = false; }, 50);
    }
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isMounting.current) return; 
    
    const currentScrollTop = e.currentTarget.scrollTop;
    const index = Math.round(currentScrollTop / ITEM_HEIGHT);
    if (index !== value && index >= 0 && index <= max) {
      setValue(index);
    }
  };

  // ИСПОЛЬЗУЕМ POINTER EVENTS ДЛЯ ГЛОБАЛЬНОГО ЗАХВАТА
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startY.current = e.pageY - containerRef.current!.offsetTop;
    scrollTop.current = containerRef.current!.scrollTop;
    containerRef.current!.style.scrollSnapType = 'none'; 
    // Магия захвата курсора: теперь браузер следит за мышью везде
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = 'y proximity'; 
    }
    // Отпускаем захват курсора
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const y = e.pageY - containerRef.current!.offsetTop;
    const walk = (y - startY.current) * 1.2; 
    containerRef.current!.scrollTop = scrollTop.current - walk;
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerMove={handlePointerMove}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="h-[192px] overflow-y-auto snap-y snap-proximity relative w-20 [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <div style={{ height: `${ITEM_HEIGHT}px` }}></div>
        {items.map((num) => (
          <div
            key={num}
            className={`h-[64px] flex items-center justify-center snap-center text-5xl tabular-nums transition-colors duration-200 ${
              value === num ? 'text-white font-normal' : 'text-[#3a3a3c] font-light'
            }`}
          >
            {num.toString().padStart(2, '0')}
          </div>
        ))}
        <div style={{ height: `${ITEM_HEIGHT}px` }}></div>
      </div>
      <span className="text-sm text-gray-500 mt-2">{label}</span>
    </div>
  );
};

export const TimerComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('timer');

  // ================= СЕКУНДОМЕР =================
  const [swTime, setSwTime] = useState<number>(0);
  const [isSwRunning, setIsSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<number[]>([]);
  
  const swStartTimeRef = useRef<number>(0);
  const swAccumulatedRef = useRef<number>(0);
  const swAnimationFrameRef = useRef<number>(0);

  const updateSwTime = () => {
    if (!swStartTimeRef.current) return;
    const now = Date.now();
    setSwTime(swAccumulatedRef.current + (now - swStartTimeRef.current));
    swAnimationFrameRef.current = requestAnimationFrame(updateSwTime);
  };

  useEffect(() => {
    if (isSwRunning) {
      swStartTimeRef.current = Date.now();
      swAnimationFrameRef.current = requestAnimationFrame(updateSwTime);
    } else {
      cancelAnimationFrame(swAnimationFrameRef.current);
      swAccumulatedRef.current = swTime;
    }
    return () => cancelAnimationFrame(swAnimationFrameRef.current);
  }, [isSwRunning]);

  const handleSwStartStop = () => setIsSwRunning(!isSwRunning);

  const handleSwLapReset = () => {
    if (isSwRunning) {
      const currentTotal = swTime;
      const previousLapsTotal = laps.reduce((a, b) => a + b, 0);
      setLaps([currentTotal - previousLapsTotal, ...laps]);
    } else {
      setSwTime(0);
      setLaps([]);
      swAccumulatedRef.current = 0;
    }
  };

  const formatSwTime = (ms: number) => {
    const totalDeciseconds = Math.floor(ms / 10);
    const m = Math.floor(totalDeciseconds / 6000);
    const s = Math.floor((totalDeciseconds % 6000) / 100);
    const ds = totalDeciseconds % 100;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ds.toString().padStart(2, '0')}`;
  };

  const currentLapTime = swTime - laps.reduce((a, b) => a + b, 0);

  // ================= ТАЙМЕР =================
  const [tmHours, setTmHours] = useState(0);
  const [tmMins, setTmMins] = useState(0);
  const [tmSecs, setTmSecs] = useState(0);
  
  const [tmTimeLeftMs, setTmTimeLeftMs] = useState<number>(0);
  const [isTmRunning, setIsTmRunning] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  const tmEndTimeRef = useRef<number>(0);
  const tmAnimationFrameRef = useRef<number>(0);

  const updateTmTime = () => {
    if (!tmEndTimeRef.current) return;
    const now = Date.now();
    const remaining = tmEndTimeRef.current - now;

    if (remaining <= 0) {
      setTmTimeLeftMs(0);
      setIsTmRunning(false);
      setShowModal(true);
      cancelAnimationFrame(tmAnimationFrameRef.current);
    } else {
      setTmTimeLeftMs(remaining);
      tmAnimationFrameRef.current = requestAnimationFrame(updateTmTime);
    }
  };

  useEffect(() => {
    if (isTmRunning) {
      tmAnimationFrameRef.current = requestAnimationFrame(updateTmTime);
    } else {
      cancelAnimationFrame(tmAnimationFrameRef.current);
    }
    return () => cancelAnimationFrame(tmAnimationFrameRef.current);
  }, [isTmRunning]);

  const startTimer = (totalSeconds: number) => {
    if (totalSeconds > 0) {
      const totalMs = totalSeconds * 1000;
      setTmTimeLeftMs(totalMs);
      tmEndTimeRef.current = Date.now() + totalMs;
      setIsTmRunning(true);
    }
  };

  const handleTmStartCancel = () => {
    if (isTmRunning) {
      setIsTmRunning(false);
      setTmTimeLeftMs(0);
    } else {
      startTimer(tmHours * 3600 + tmMins * 60 + tmSecs);
    }
  };

  const addTime = (mins: number) => {
    if (isTmRunning) {
      tmEndTimeRef.current += mins * 60 * 1000;
    } else {
      startTimer(mins * 60);
    }
  };

  const formatTmTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const cs = Math.floor((ms % 1000) / 10); 

    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${cs.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[600px] bg-black text-white relative select-none">
      
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-[#1c1c1e] p-8 rounded-3xl flex flex-col items-center w-full max-w-sm border border-slate-800 shadow-2xl transform transition-all">
            <div className="text-5xl mb-4 animate-bounce">⏰</div>
            <h3 className="text-2xl font-bold mb-2">Время вышло!</h3>
            <p className="text-gray-400 mb-8 text-center">Пора приступать к следующему подходу.</p>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <div className="flex bg-[#1c1c1e] rounded-xl p-1 mx-4 mt-6 mb-8 max-w-sm self-center w-full">
        <button 
          onClick={() => setActiveTab('stopwatch')} 
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'stopwatch' ? 'bg-[#2c2c2e] text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          Секундомер
        </button>
        <button 
          onClick={() => setActiveTab('timer')} 
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'timer' ? 'bg-[#2c2c2e] text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          Таймер
        </button>
      </div>

      {/* =========== СЕКУНДОМЕР =========== */}
      {activeTab === 'stopwatch' && (
        <div className="flex flex-col flex-1 px-4 max-w-md mx-auto w-full">
          <div className="text-[5rem] font-light tracking-tight tabular-nums text-center mt-10 mb-16">
            {formatSwTime(swTime)}
          </div>

          <div className="flex justify-between w-full px-6 mb-8">
            <button
              onClick={handleSwLapReset}
              className={`w-[80px] h-[80px] rounded-full flex items-center justify-center border-2 transition-colors ${
                isSwRunning ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              <span className="font-medium">{isSwRunning ? 'Круг' : 'Сброс'}</span>
            </button>
            <button
              onClick={handleSwStartStop}
              className={`w-[80px] h-[80px] rounded-full flex items-center justify-center border-2 transition-colors ${
                isSwRunning ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'
              }`}
            >
              <span className="font-medium">{isSwRunning ? 'Стоп' : 'Старт'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto border-t border-gray-800 pt-2">
            {(laps.length > 0 || isSwRunning) && (
              <div className="flex justify-between py-3 px-2 text-white border-b border-gray-800">
                <span>Круг {laps.length + 1}</span>
                <span className="tabular-nums font-mono">{formatSwTime(currentLapTime)}</span>
              </div>
            )}
            {laps.map((lapTime, index) => (
              <div key={index} className="flex justify-between py-3 px-2 text-gray-300 border-b border-gray-800">
                <span>Круг {laps.length - index}</span>
                <span className="tabular-nums font-mono">{formatSwTime(lapTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========== ТАЙМЕР =========== */}
      {activeTab === 'timer' && (
        <div className="flex flex-col flex-1 px-4 max-w-md mx-auto w-full items-center">

          {isTmRunning ? (
            <div className="flex flex-col items-center justify-center flex-1 w-full gap-10">
              <div className="text-[5rem] font-light tracking-tight tabular-nums text-white whitespace-nowrap">
                {formatTmTime(tmTimeLeftMs)}
              </div>

              <div className="flex flex-col items-center gap-3 w-full">
                <p className="text-xs text-gray-600 uppercase tracking-widest">добавить время</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 5].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => addTime(mins)}
                      className="px-5 py-2.5 rounded-full bg-[#1c1c1e] border border-gray-800 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all"
                    >
                      +{mins} мин
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTmStartCancel}
                className="w-24 h-24 rounded-full flex items-center justify-center border-2 bg-red-500/20 border-red-500/30 text-red-500 transition-colors"
              >
                <span className="font-medium text-lg">Отмена</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full mt-4">

              <div className="flex justify-center items-center gap-4 mb-10 w-full bg-[#1c1c1e] py-4 rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-[#1c1c1e] to-transparent pointer-events-none z-10"></div>
                <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none z-10"></div>

                <ScrollPicker value={tmHours} setValue={setTmHours} max={23} label="часов" />
                <div className="flex flex-col items-center">
                  <div className="h-[192px] flex items-center justify-center">
                    <span className="text-4xl font-light text-[#3a3a3c]">:</span>
                  </div>
                  <span className="text-sm mt-2 invisible">x</span>
                </div>
                <ScrollPicker value={tmMins} setValue={setTmMins} max={59} label="минут" />
                <div className="flex flex-col items-center">
                  <div className="h-[192px] flex items-center justify-center">
                    <span className="text-4xl font-light text-[#3a3a3c]">:</span>
                  </div>
                  <span className="text-sm mt-2 invisible">x</span>
                </div>
                <ScrollPicker value={tmSecs} setValue={setTmSecs} max={59} label="секунд" />
              </div>

              <div className="flex flex-col items-center gap-3 w-full mb-10">
                <p className="text-xs text-gray-600 uppercase tracking-widest">быстрый старт</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 5].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => addTime(mins)}
                      className="px-5 py-2.5 rounded-full bg-[#2c2c2e] border border-gray-700 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all"
                    >
                      +{mins} мин
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTmStartCancel}
                disabled={tmHours === 0 && tmMins === 0 && tmSecs === 0}
                className="w-24 h-24 rounded-full flex items-center justify-center border-2 bg-emerald-500/20 border-emerald-500/30 text-emerald-500 disabled:opacity-30 disabled:border-gray-700 disabled:bg-transparent disabled:text-gray-500 transition-colors"
              >
                <span className="font-medium text-lg">Старт</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};