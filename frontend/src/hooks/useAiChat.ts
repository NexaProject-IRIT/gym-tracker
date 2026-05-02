// src/hooks/useAiChat.ts
import { useCallback, useEffect, useRef, useState } from 'react';

const BASE = '';

export type ChatRole = 'user' | 'assistant';

export interface WorkoutSuggestion {
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'functional' | 'custom';
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    time?: number;
    distance?: number;
  }>;
}

export interface WorkoutImportEntry {
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'functional' | 'custom';
  date: string; // YYYY-MM-DD
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    time?: number;
    distance?: number;
  }>;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  workout_suggestion: WorkoutSuggestion | null;
  workout_imports: WorkoutImportEntry[] | null;
  created_at: string;
  workoutAdded?: boolean;
  workoutsImported?: boolean;
}

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Token ${getToken()}`,
  };
}

function inferParameters(ex: { sets?: number; reps?: number; weight?: number; time?: number; distance?: number }): string[] {
  const params: string[] = [];
  if (ex.sets != null)     params.push('sets');
  if (ex.reps != null)     params.push('reps');
  if (ex.weight != null)   params.push('weight');
  if (ex.time != null)     params.push('time');
  if (ex.distance != null) params.push('distance');
  return params.length ? params : ['sets', 'reps'];
}

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/ai/history/`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить историю');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError(null);

    const tempId = `tmp_${Date.now()}`;
    const optimisticUserMsg: ChatMessage = {
      id: tempId,
      role: 'user',
      content: trimmed,
      workout_suggestion: null,
      workout_imports: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const res = await fetch(`${BASE}/ai/chat/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const body = await res.text();
        let reason = `Ошибка ${res.status}`;
        try {
          const parsed = JSON.parse(body);
          reason = parsed.error || reason;
        } catch { /* не JSON */ }
        throw new Error(reason);
      }

      const data = await res.json();
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        return [...withoutTemp, data.user_message, data.assistant_message];
      });

      if (data.error) {
        setError(data.error);
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError(e instanceof Error ? e.message : 'Не удалось отправить сообщение');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${BASE}/ai/history/`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) throw new Error(`Ошибка ${res.status}`);
      setMessages([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось очистить историю');
    }
  }, []);

  const addWorkoutFromSuggestion = useCallback(async (messageId: string): Promise<string | null> => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.workout_suggestion) return null;

    const suggestion = msg.workout_suggestion;
    const body = {
      name: suggestion.name,
      type: suggestion.type,
      date: new Date().toISOString(),
      notes: '',
      exercises: suggestion.exercises.map(ex => ({
        exerciseId: '',
        customName: ex.name,
        sets: ex.sets ?? 0,
        reps: ex.reps ?? 0,
        weight: ex.weight ?? null,
        time: ex.time ?? null,
        distance: ex.distance ?? null,
        isCustom: true,
        parameters: inferParameters(ex),
      })),
    };

    try {
      const res = await fetch(`${BASE}/workouts/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const created = await res.json();
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, workoutAdded: true } : m));
      return created.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить тренировку');
      return null;
    }
  }, [messages]);

  const addWorkoutsFromImport = useCallback(async (messageId: string): Promise<number> => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.workout_imports?.length) return 0;

    try {
      const res = await fetch(`${BASE}/workouts/bulk-import/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ workouts: msg.workout_imports }),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, workoutsImported: true } : m));
      return data.count ?? 0;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось импортировать тренировки');
      return 0;
    }
  }, [messages]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    clearHistory,
    addWorkoutFromSuggestion,
    addWorkoutsFromImport,
    setError,
  };
};
