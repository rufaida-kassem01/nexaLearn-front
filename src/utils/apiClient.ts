import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

let _accessToken: string | null = null;
let _refreshToken: string | null = null;
let _onAuthFailure: (() => void) | null = null;

export const setAccessToken = (token: string | null): void => {
  _accessToken = token;
};

export const setAuthToken = setAccessToken;

export const setRefreshToken = (token: string | null): void => {
  _refreshToken = token;
};

export const onAuthFailure = (fn: () => void): void => {
  _onAuthFailure = fn;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url?.includes('/auth/refresh')) {
      if (_refreshToken && !config.data) {
        config.data = { refreshToken: _refreshToken };
      }
    } else if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

let _isRefreshing = false;
let _pendingQueue: PendingRequest[] = [];

const unwrapData = (data: unknown): unknown => {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as Record<string, unknown>).data;
  }
  return data;
};

apiClient.interceptors.response.use(
  (response) => {
    return unwrapData(response.data) as never;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isInitEndpoint = originalRequest.url?.includes('/auth/me') || originalRequest.url?.includes('/auth/refresh');
    if (isInitEndpoint) {
      return Promise.reject(error);
    }

    if (!_refreshToken) {
      if (_onAuthFailure) _onAuthFailure();
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _pendingQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      const base = apiClient.defaults.baseURL || '';
      const refreshRes = await axios.post(
        `${base}/auth/refresh`,
        { refreshToken: _refreshToken },
        { withCredentials: true },
      );
      const payload = unwrapData(refreshRes.data) as Record<string, unknown> | null;
      const newAccessToken = payload?.accessToken as string | undefined;
      const newRefreshToken = payload?.refreshToken as string | undefined;
      if (!newAccessToken) throw new Error('Refresh failed');

      _accessToken = newAccessToken;
      if (newRefreshToken) _refreshToken = newRefreshToken;

      _pendingQueue.forEach(({ resolve, reject, config }) => {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(apiClient(config));
      });
      _pendingQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest) as never;
    } catch (refreshError) {
      _accessToken = null;
      _refreshToken = null;
      _pendingQueue.forEach(({ reject }) => reject(refreshError));
      _pendingQueue = [];
      if (_onAuthFailure) _onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  },
);

export default apiClient;
