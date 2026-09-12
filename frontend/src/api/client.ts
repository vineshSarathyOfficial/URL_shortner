// Empty VITE_API_URL = same-origin (production on Railway). Dev defaults to local API.
const API_BASE =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
      ? 'http://localhost:8000'
      : '';

export interface ApiError {
  error: { code: string; message: string };
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const hasBody = options.body !== undefined && options.body !== null && options.body !== '';
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Request failed' },
    }));
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Link {
  id: string;
  original_url: string;
  short_code: string;
  short_url: string;
  click_count: number;
  status: string;
  effective_status: string;
  created_at: string;
  last_activated_at: string | null;
  reactivated_at: string | null;
  last_health_checked_at: string | null;
}

export interface Analytics {
  total_clicks: number;
  clicks_by_day: { date: string; count: number }[];
  recent_accesses: { accessed_at: string }[];
}

export const authApi = {
  signup: (username: string, password: string) =>
    apiRequest<User>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => apiRequest<User>('/api/auth/me'),
  logout: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
  deleteAccount: () => apiRequest<void>('/api/auth/account', { method: 'DELETE' }),
};

export const linksApi = {
  create: (original_url: string) =>
    apiRequest<Link>('/api/links', {
      method: 'POST',
      body: JSON.stringify({ original_url }),
    }),
  list: () => apiRequest<{ links: Link[]; total: number }>('/api/links'),
  get: (id: string) => apiRequest<Link>(`/api/links/${id}`),
  delete: (id: string) => apiRequest<void>(`/api/links/${id}`, { method: 'DELETE' }),
  reactivate: (id: string) =>
    apiRequest<Link>(`/api/links/${id}/reactivate`, { method: 'POST' }),
  analytics: (id: string, period = 'day') =>
    apiRequest<Analytics>(`/api/links/${id}/analytics?period=${period}`),
};
