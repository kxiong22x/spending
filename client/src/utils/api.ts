export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Makes an authenticated fetch to the API and returns parsed JSON; throws on non-2xx responses.
export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const init: RequestInit = { credentials: 'include', ...options };
  if (init.body && typeof init.body === 'string') {
    init.headers = { 'Content-Type': 'application/json', ...init.headers };
  }
  const res = await fetch(`${API}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data as T;
}
