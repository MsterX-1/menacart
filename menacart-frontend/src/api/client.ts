import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
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
      if (isRefreshing) {
        // Queue the request until refresh finishes
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt token rotation. The backend reads HTTP-only cookies and sets new ones.
        const response = await axios.post<{ token: string; tokenExpiresOn: string; roles: string[] }>(
          '/api/auth/RefreshToken',
          {},
          { withCredentials: true }
        );

        const newToken = response.data.token;
        setAccessToken(newToken);
        
        // Notify the subscriber queue
        onRefreshed(newToken);
        isRefreshing = false;

        // Re-run original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        setAccessToken(null);
        
        // Redirect to login only in browser environments
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-logout'));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
