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

// Singleton refresh promise — prevents multiple simultaneous refresh calls
let refreshPromise: Promise<boolean> | null = null;
let redirecting = false;

async function tryRefresh(): Promise<boolean> {
  if (redirecting) return false;
  if (refreshPromise) return refreshPromise;

  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authedFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  if (redirecting) {
    // Already heading to login — don't make new requests
    return new Response(null, { status: 401 });
  }

  const buildHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined ?? {}),
    Authorization: `Bearer ${getAccessToken()}`,
  });

  const res = await fetch(input, { ...init, headers: buildHeaders() });
  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (!refreshed) {
    redirecting = true;
    clearTokens();
    window.location.href = '/login';
    return new Response(null, { status: 401 });
  }
  return fetch(input, { ...init, headers: buildHeaders() });
}
