import axios from 'axios';

let _accessToken = null;
let _refreshToken = null;
let _onAuthFailure = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

export const setAuthToken = setAccessToken;

export const setRefreshToken = (token) => {
  _refreshToken = token;
};

export const onAuthFailure = (fn) => {
  _onAuthFailure = fn;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/auth/refresh')) {
      if (_refreshToken && !config.data) {
        config.data = { refreshToken: _refreshToken };
      }
    } else if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let _isRefreshing = false;
let _pendingQueue = [];

const unwrapData = (data) => {
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

apiClient.interceptors.response.use(
  (response) => {
    return unwrapData(response.data);
  },
  async (error) => {
    const originalRequest = error.config;

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
      const payload = unwrapData(refreshRes.data);
      const newAccessToken = payload?.accessToken;
      const newRefreshToken = payload?.refreshToken;
      if (!newAccessToken) throw new Error('Refresh failed');

      _accessToken = newAccessToken;
      if (newRefreshToken) _refreshToken = newRefreshToken;

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      _pendingQueue.forEach(({ resolve, reject, config }) => {
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        resolve(apiClient(config));
      });
      _pendingQueue = [];

      return apiClient(originalRequest);
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
