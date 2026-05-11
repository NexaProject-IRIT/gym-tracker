const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refresh_token';

export const getAccessToken = (): string => localStorage.getItem(TOKEN_KEY) ?? '';

export const setTokens = (access: string, refresh: string): void => {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('user');
};

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch('/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function authedFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const buildHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined ?? {}),
    Authorization: `Bearer ${getAccessToken()}`,
  });

  const res = await fetch(input, { ...init, headers: buildHeaders() });
  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (!refreshed) {
    window.location.href = '/login';
    return res;
  }
  return fetch(input, { ...init, headers: buildHeaders() });
}
