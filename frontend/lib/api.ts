import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    // No refresh token, redirect to login
                    if (typeof window !== 'undefined') {
                        localStorage.clear();
                        window.location.href = '/login';
                    }
                    return Promise.reject(error);
                }

                // Try to refresh the token
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token: newRefreshToken } = response.data;

                // Store new tokens
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', newRefreshToken);

                // Retry original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
