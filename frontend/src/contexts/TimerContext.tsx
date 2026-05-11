import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

type Tab = 'stopwatch' | 'timer';

interface TimerContextValue {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  swTime: number;
  isSwRunning: boolean;
  laps: number[];
  swStartStop: () => void;
  swLapReset: () => void;
  formatSwTime: (ms: number) => string;
  tmHours: number;
  tmMins: number;
  tmSecs: number;
  setTmHours: (v: number) => void;
  setTmMins: (v: number) => void;
  setTmSecs: (v: number) => void;
  tmTimeLeftMs: number;
  isTmRunning: boolean;
  tmStartCancel: () => void;
  tmPreset: (mins: number) => void;
  tmAddTime: (mins: number) => void;
  formatTmTime: (ms: number) => string;
  tmFinished: boolean;
  clearTmFinished: () => void;
}

const TimerCtx = createContext<TimerContextValue | null>(null);

export const useTimer = (): TimerContextValue => {
  const c = useContext(TimerCtx);
  if (!c) throw new Error('useTimer must be used within TimerProvider');
  return c;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<Tab>('timer');

  // ── Stopwatch ──────────────────────────────────────────────────────────────
  const [swTime, setSwTime] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swStartRef = useRef(0);
  const swAccumRef = useRef(0);
  const swTimeRef = useRef(0);
  const swRafRef = useRef(0);

  const tickSw = () => {
    const t = swAccumRef.current + (Date.now() - swStartRef.current);
    swTimeRef.current = t;
    setSwTime(t);
    swRafRef.current = requestAnimationFrame(tickSw);
  };

  useEffect(() => {
    if (isSwRunning) {
      swStartRef.current = Date.now();
      swRafRef.current = requestAnimationFrame(tickSw);
    } else {
      cancelAnimationFrame(swRafRef.current);
      swAccumRef.current = swTimeRef.current;
    }
    return () => cancelAnimationFrame(swRafRef.current);
  }, [isSwRunning]);

  const swStartStop = useCallback(() => setIsSwRunning(r => !r), []);

  const swLapReset = useCallback(() => {
    if (isSwRunning) {
      setLaps(prev => {
        const prevTotal = prev.reduce((a, b) => a + b, 0);
        return [swTimeRef.current - prevTotal, ...prev];
      });
    } else {
      swTimeRef.current = 0;
      swAccumRef.current = 0;
      setSwTime(0);
      setLaps([]);
    }
  }, [isSwRunning]);

  const formatSwTime = (ms: number): string => {
    const d = Math.floor(ms / 10);
    const m = Math.floor(d / 6000);
    const s = Math.floor((d % 6000) / 100);
    const cs = d % 100;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(cs).padStart(2, '0')}`;
  };

  // ── Countdown ──────────────────────────────────────────────────────────────
  const [tmHours, setTmHours] = useState(0);
  const [tmMins, setTmMins] = useState(0);
  const [tmSecs, setTmSecs] = useState(0);
  const [tmTimeLeftMs, setTmTimeLeftMs] = useState(0);
  const [isTmRunning, setIsTmRunning] = useState(false);
  const [tmFinished, setTmFinished] = useState(false);
  const tmEndRef = useRef(0);
  const tmRafRef = useRef(0);

  const tickTm = () => {
    const remaining = tmEndRef.current - Date.now();
    if (remaining <= 0) {
      setTmTimeLeftMs(0);
      setIsTmRunning(false);
      setTmFinished(true);
      return;
    }
    setTmTimeLeftMs(remaining);
    tmRafRef.current = requestAnimationFrame(tickTm);
  };

  useEffect(() => {
    if (isTmRunning) {
      tmRafRef.current = requestAnimationFrame(tickTm);
    } else {
      cancelAnimationFrame(tmRafRef.current);
    }
    return () => cancelAnimationFrame(tmRafRef.current);
  }, [isTmRunning]);

  const startCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return;
    const ms = totalSecs * 1000;
    setTmTimeLeftMs(ms);
    tmEndRef.current = Date.now() + ms;
    setIsTmRunning(true);
  };

  const tmStartCancel = useCallback(() => {
    if (isTmRunning) {
      setIsTmRunning(false);
      setTmTimeLeftMs(0);
    } else {
      startCountdown(tmHours * 3600 + tmMins * 60 + tmSecs);
    }
  }, [isTmRunning, tmHours, tmMins, tmSecs]);

  const tmPreset = useCallback((mins: number) => {
    setTmHours(0);
    setTmMins(mins);
    setTmSecs(0);
    startCountdown(mins * 60);
  }, []);

  const tmAddTime = useCallback((mins: number) => {
    if (isTmRunning) {
      tmEndRef.current += mins * 60 * 1000;
    } else {
      startCountdown(mins * 60);
    }
  }, [isTmRunning]);

  const formatTmTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const clearTmFinished = useCallback(() => setTmFinished(false), []);

  return (
    <TimerCtx.Provider value={{
      activeTab, setActiveTab,
      swTime, isSwRunning, laps, swStartStop, swLapReset, formatSwTime,
      tmHours, tmMins, tmSecs, setTmHours, setTmMins, setTmSecs,
      tmTimeLeftMs, isTmRunning, tmStartCancel, tmPreset, tmAddTime, formatTmTime,
      tmFinished, clearTmFinished,
    }}>
      {children}
    </TimerCtx.Provider>
  );
};
