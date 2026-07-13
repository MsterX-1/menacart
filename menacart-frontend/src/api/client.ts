import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../types/auth';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

let refreshTokenRequest: Promise<AuthResponse> | null = null;

export const performTokenRefresh = async (): Promise<AuthResponse> => {
  if (refreshTokenRequest) {
    return refreshTokenRequest;
  }
  
  refreshTokenRequest = (async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post<AuthResponse>(
        `${apiBaseUrl}/Auth/RefreshToken`,
        {},
        { withCredentials: true }
      );
      const newToken = response.data.token;
      setAccessToken(newToken);
      return response.data;
    } catch (error) {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-logout'));
      }
      throw error;
    } finally {
      refreshTokenRequest = null;
    }
  })();
  
  return refreshTokenRequest;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for receiving and sending the HTTP-only refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach the bearer token if it exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle expired tokens with silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 response and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const data = await performTokenRefresh();
        
        // Re-run original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
