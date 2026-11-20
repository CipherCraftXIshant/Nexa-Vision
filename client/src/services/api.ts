import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexavision_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('nexavision_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data.success) {
            localStorage.setItem('nexavision_access_token', res.data.accessToken);
            localStorage.setItem('nexavision_refresh_token', res.data.refreshToken);
            window.dispatchEvent(new Event('nexavision:session-updated'));
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (err) {
        localStorage.removeItem('nexavision_access_token');
        localStorage.removeItem('nexavision_refresh_token');
        localStorage.removeItem('nexavision_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
