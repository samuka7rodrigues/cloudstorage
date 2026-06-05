const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null };
  const accessToken = localStorage.getItem('accessToken');
  return { accessToken };
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = getTokens();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTokens(data.accessToken, data.refreshToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;

        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          method: options.method || 'GET',
          headers,
          body: options.body
            ? options.body instanceof FormData
              ? options.body
              : JSON.stringify(options.body)
            : undefined,
        });

        if (!retryResponse.ok) {
          throw new ApiError(await retryResponse.json(), retryResponse.status);
        }

        return retryResponse.json();
      }
    }
    clearTokens();
  }

  if (!response.ok) {
    throw new ApiError(await response.json(), response.status);
  }

  return response.json();
}

export class ApiError extends Error {
  statusCode: number;

  constructor(body: any, statusCode: number) {
    super(body.message || 'An error occurred');
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: any; accessToken: string; refreshToken: string }>('/auth/register', {
        method: 'POST',
        body: data,
      }).then((res) => {
        setTokens(res.accessToken, res.refreshToken);
        return res;
      }),

    login: (data: { email: string; password: string }) =>
      request<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: data,
      }).then((res) => {
        setTokens(res.accessToken, res.refreshToken);
        return res;
      }),

    logout: () => {
      clearTokens();
    },
  },
};
