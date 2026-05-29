import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';

type Tab = 'stopwatch' | 'timer';

interface TimerContextValue {
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;

  // ── Stopwatch ──
  swTime: number;
  isSwRunning: boolean;
  swStartStop: () => void;
  swReset: () => void;

  // ── Countdown ──
  tmTimeLeftMs: number;
  tmTotalMs: number;
  isTmRunning: boolean;
  tmFinished: boolean;
  tmStartPreset: (mins: number) => void;
  tmAddMinutes: (mins: number) => void;
  tmPauseResume: () => void;
  tmReset: () => void;
  clearTmFinished: () => void;
}

const TimerCtx = createContext<TimerContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useTimer = (): TimerContextValue => {
  const c = useContext(TimerCtx);
  if (!c) throw new Error('useTimer must be used within TimerProvider');
  return c;
};

// ── Persistence ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gymTimer:v2';

interface Persisted {
  activeTab: Tab;
  swAccumMs: number;
  swStartedAt: number | null;
  tmTotalMs: number;
  tmEndAt: number | null;
  tmPausedRemainingMs: number | null;
}

const DEFAULT_STATE: Persisted = {
  activeTab: 'timer',
  swAccumMs: 0,
  swStartedAt: null,
  tmTotalMs: 0,
  tmEndAt: null,
  tmPausedRemainingMs: null,
};

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = useMemo(loadPersisted, []);

  const [activeTab, setActiveTab] = useState<Tab>(initial.activeTab);

  // ── Stopwatch ──────────────────────────────────────────────────────────────
  const swAccumRef = useRef<number>(initial.swAccumMs);
  const swStartedAtRef = useRef<number | null>(initial.swStartedAt);
  const swRafRef = useRef<number>(0);

  const computeSwElapsed = (): number =>
    swAccumRef.current + (swStartedAtRef.current ? Date.now() - swStartedAtRef.current : 0);

  const [swTime, setSwTime] = useState<number>(computeSwElapsed());
  const [isSwRunning, setIsSwRunning] = useState<boolean>(initial.swStartedAt !== null);

  useEffect(() => {
    if (!isSwRunning) {
      cancelAnimationFrame(swRafRef.current);
      return;
    }
    const tick = () => {
      setSwTime(computeSwElapsed());
      swRafRef.current = requestAnimationFrame(tick);
    };
    swRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(swRafRef.current);
  }, [isSwRunning]);

  const swStartStop = useCallback(() => {
    setIsSwRunning(running => {
      if (running) {
        // pause: commit elapsed into accum
        swAccumRef.current = computeSwElapsed();
        swStartedAtRef.current = null;
        setSwTime(swAccumRef.current);
        return false;
      } else {
        swStartedAtRef.current = Date.now();
        return true;
      }
    });
  }, []);

  const swReset = useCallback(() => {
    swAccumRef.current = 0;
    swStartedAtRef.current = null;
    setSwTime(0);
    setIsSwRunning(false);
  }, []);

  // ── Countdown ──────────────────────────────────────────────────────────────
  const [tmTotalMs, setTmTotalMs] = useState<number>(initial.tmTotalMs);
  const tmEndAtRef = useRef<number | null>(initial.tmEndAt);
  const tmPausedRemainingRef = useRef<number | null>(initial.tmPausedRemainingMs);
  const tmRafRef = useRef<number>(0);

  const computeTmLeft = (): number => {
    if (tmEndAtRef.current !== null) return Math.max(0, tmEndAtRef.current - Date.now());
    if (tmPausedRemainingRef.current !== null) return tmPausedRemainingRef.current;
    return 0;
  };

  const [tmTimeLeftMs, setTmTimeLeftMs] = useState<number>(computeTmLeft());
  const [isTmRunning, setIsTmRunning] = useState<boolean>(initial.tmEndAt !== null);
  const [tmFinished, setTmFinished] = useState<boolean>(false);

  // If we hydrated with an end time already in the past, mark as finished immediately.
  useEffect(() => {
    if (initial.tmEndAt !== null && initial.tmEndAt - Date.now() <= 0) {
      tmEndAtRef.current = null;
      tmPausedRemainingRef.current = null;
      setTmTimeLeftMs(0);
      setIsTmRunning(false);
      setTmFinished(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isTmRunning) {
      cancelAnimationFrame(tmRafRef.current);
      return;
    }
    const tick = () => {
      const left = computeTmLeft();
      setTmTimeLeftMs(left);
      if (left <= 0) {
        tmEndAtRef.current = null;
        tmPausedRemainingRef.current = null;
        setIsTmRunning(false);
        setTmFinished(true);
        return;
      }
      tmRafRef.current = requestAnimationFrame(tick);
    };
    tmRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(tmRafRef.current);
  }, [isTmRunning]);

  const tmStartPreset = useCallback((mins: number) => {
    const ms = mins * 60 * 1000;
    setTmTotalMs(ms);
    tmEndAtRef.current = Date.now() + ms;
    tmPausedRemainingRef.current = null;
    setTmTimeLeftMs(ms);
    setTmFinished(false);
    setIsTmRunning(true);
  }, []);

  const tmAddMinutes = useCallback((mins: number) => {
    const addMs = mins * 60 * 1000;
    if (isTmRunning && tmEndAtRef.current !== null) {
      tmEndAtRef.current += addMs;
      setTmTotalMs(prev => prev + addMs);
      setTmTimeLeftMs(computeTmLeft());
    } else if (tmPausedRemainingRef.current !== null) {
      tmPausedRemainingRef.current += addMs;
      setTmTotalMs(prev => prev + addMs);
      setTmTimeLeftMs(tmPausedRemainingRef.current);
    } else {
      // No active or paused timer → behave like a fresh preset start
      tmStartPreset(mins);
    }
  }, [isTmRunning, tmStartPreset]);

  const tmPauseResume = useCallback(() => {
    if (isTmRunning && tmEndAtRef.current !== null) {
      // pause: save remaining
      const remaining = Math.max(0, tmEndAtRef.current - Date.now());
      tmPausedRemainingRef.current = remaining;
      tmEndAtRef.current = null;
      setTmTimeLeftMs(remaining);
      setIsTmRunning(false);
    } else if (tmPausedRemainingRef.current !== null && tmPausedRemainingRef.current > 0) {
      // resume from paused
      tmEndAtRef.current = Date.now() + tmPausedRemainingRef.current;
      tmPausedRemainingRef.current = null;
      setIsTmRunning(true);
    }
  }, [isTmRunning]);

  const tmReset = useCallback(() => {
    tmEndAtRef.current = null;
    tmPausedRemainingRef.current = null;
    setTmTotalMs(0);
    setTmTimeLeftMs(0);
    setIsTmRunning(false);
    setTmFinished(false);
  }, []);

  const clearTmFinished = useCallback(() => setTmFinished(false), []);

  // ── Persistence: write to localStorage on every meaningful change ──────────
  useEffect(() => {
    const snapshot: Persisted = {
      activeTab,
      swAccumMs: swAccumRef.current,
      swStartedAt: swStartedAtRef.current,
      tmTotalMs,
      tmEndAt: tmEndAtRef.current,
      tmPausedRemainingMs: tmPausedRemainingRef.current,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch { /* quota / private mode */ }
  }, [activeTab, isSwRunning, swTime, isTmRunning, tmTimeLeftMs, tmTotalMs, tmFinished]);

  return (
    <TimerCtx.Provider value={{
      activeTab, setActiveTab,
      swTime, isSwRunning, swStartStop, swReset,
      tmTimeLeftMs, tmTotalMs, isTmRunning, tmFinished,
      tmStartPreset, tmAddMinutes, tmPauseResume, tmReset, clearTmFinished,
    }}>
      {children}
    </TimerCtx.Provider>
  );
};
