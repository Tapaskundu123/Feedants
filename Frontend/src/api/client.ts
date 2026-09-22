import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

export const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // 1. If running under Expo dev server / Metro, scriptURL contains host computer IP
  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
    if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
      return `http://${match[1]}:5000/api`;
    }
  }

  // 2. Default to current Wi-Fi host IP for physical devices (Expo Go)
  return 'http://172.20.10.2:5000/api';
};

export const getStoredBaseUrl = async (): Promise<string> => {
  const custom = await AsyncStorage.getItem('custom_api_url');
  return custom || getDefaultBaseUrl();
};

export const setStoredBaseUrl = async (url: string): Promise<void> => {
  await AsyncStorage.setItem('custom_api_url', url.trim());
};

const api: AxiosInstance = axios.create({
  baseURL: getDefaultBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: attach JWT & dynamic baseURL ─────────
api.interceptors.request.use(async (config) => {
  const customUrl = await AsyncStorage.getItem('custom_api_url');
  config.baseURL = customUrl || getDefaultBaseUrl();

  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: normalise errors ───────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Typed API helpers ────────────────────────────────────────
export const competitionApi = {
  list: () => api.get('/competitions'),

  getById: (id: string) => api.get(`/competitions/${id}`),

  register: (id: string, payload: { paymentId?: string; referralCode?: string }) =>
    api.post(`/competitions/${id}/register`, payload),

  submit: (id: string, submissionUrl: string) =>
    api.post(`/competitions/${id}/submit`, { submissionUrl }),

  getReferral: (id: string) => api.get(`/competitions/${id}/referral`),
};

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    referralCode?: string;
  }) => api.post('/auth/register', payload),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),
};

export default api;
