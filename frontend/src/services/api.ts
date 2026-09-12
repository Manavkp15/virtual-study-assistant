import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vsa_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const currentLang = localStorage.getItem('i18nextLng') || localStorage.getItem('language') || 'en';
  const normalizedLang = currentLang.startsWith('gu') ? 'gu' : 'en';
  config.headers['Accept-Language'] = normalizedLang;
  if (!config.params) {
    config.params = {};
  }
  if (!config.params.lang) {
    config.params.lang = normalizedLang;
  }
  return config;
});

export default api;
