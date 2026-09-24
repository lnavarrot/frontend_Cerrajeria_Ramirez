import axios from 'axios';

export const backendApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
export const tokenStorage = {
  get accessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
backendApi.interceptors.request.use(config => {
  const token = tokenStorage.accessToken;
  if (token && !config.url?.endsWith('/auth/refresh'))
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshRequest: Promise<string> | null = null;
backendApi.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes('/auth/'))
      return Promise.reject(error);
    const refreshToken = tokenStorage.refreshToken;
    if (!refreshToken) {
      tokenStorage.clear();
      return Promise.reject(error);
    }
    original._retry = true;
    refreshRequest ??= backendApi
      .post('/auth/refresh', { refreshToken })
      .then(({ data }) => {
        tokenStorage.set(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      })
      .finally(() => {
        refreshRequest = null;
      });
    try {
      const token = await refreshRequest;
      original.headers.Authorization = `Bearer ${token}`;
      return backendApi(original);
    } catch (refreshError) {
      tokenStorage.clear();
      return Promise.reject(refreshError);
    }
  }
);
