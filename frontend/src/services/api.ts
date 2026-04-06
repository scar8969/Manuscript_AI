import { useStore } from '../store/useStore';
import type { User, Document, Template, PaginatedResponse } from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (!refreshed) {
      useStore.getState().clearAuth();
      throw new Error('Session expired');
    }
    const newToken = useStore.getState().accessToken;
    headers['Authorization'] = `Bearer ${newToken}`;
    const retry = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    if (!retry.ok) {
      const err = await parseErrorResponse(retry);
      throw new Error(err);
    }
    return retry.json();
  }

  if (!response.ok) {
    const err = await parseErrorResponse(response);
    throw new Error(err);
  }

  return response.json();
}

async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.error?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const currentUser = useStore.getState().user;
    if (!currentUser) return false;

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!res.ok) return false;
    const data = await res.json();
    useStore.getState().setAuth(currentUser, data.accessToken);
    return true;
  } catch {
    return false;
  }
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

export const api = {
  auth: {
    register: (email: string, password: string, name: string) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name })
      }),
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: User }>('/auth/me')
  },

  documents: {
    list: () => request<Document[]>('/documents'),
    get: (id: string) => request<Document>(`/documents/${id}`),
    create: (title: string, latex: string) =>
      request<Document>('/documents', {
        method: 'POST',
        body: JSON.stringify({ title, latex })
      }),
    update: (id: string, data: { title?: string; latex?: string }) =>
      request<Document>(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/documents/${id}`, { method: 'DELETE' })
  },

  compile: async (latex: string): Promise<Blob> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_BASE}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latex }),
        signal: controller.signal
      });

      if (!res.ok) {
        const err = await parseErrorResponse(res);
        throw new Error(err);
      }
      return res.blob();
    } finally {
      clearTimeout(timeout);
    }
  },

  aiEdit: async (latex: string, prompt: string, jobDescription?: string) => {
    return request<{ updated_latex: string }>('/ai-edit', {
      method: 'POST',
      body: JSON.stringify({ latex, prompt, jobDescription })
    });
  },

  scrape: async (url: string) => {
    return request('/scrape', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  },

  analyze: async (description: string) => {
    return request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ jobDescription: description })
    });
  },

  templates: {
    list: () => request<PaginatedResponse<Template>>('/templates/local'),
    get: async (id: string) => request<Template>(`/templates/local/${id}`),
  },
};
