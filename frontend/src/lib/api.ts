import { authedFetch } from '../utils/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await authedFetch(path, init ?? {});

  if (!res.ok) {
    let data: unknown;
    let message = `Ошибка ${res.status}`;
    try {
      data = await res.json();
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        const first = d.detail ?? d.error ?? d.message;
        if (typeof first === 'string') message = first;
      }
    } catch { /* not JSON — keep default message */ }
    throw new ApiError(res.status, message, data);
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return undefined as T;

  return res.json() as Promise<T>;
}
