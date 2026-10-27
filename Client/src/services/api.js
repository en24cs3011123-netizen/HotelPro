import axios from 'axios';

/**
 * Resolve API Base URL from Vite environment variables.
 * Prioritizes import.meta.env.VITE_API_URL, falls back to VITE_API_BASE_URL,
 * and defaults to local development backend.
 * Guaranteed to normalize and end in '/api/v1'.
 */
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  let cleanUrl = String(envUrl).trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api/v1')) {
    if (cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/v1`;
    } else {
      cleanUrl = `${cleanUrl}/api/v1`;
    }
  }
  return cleanUrl;
};

const API_BASE_URL = resolveApiBaseUrl();

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
  window.__HOTELPRO_ACCESS_TOKEN__ = token;
};

export const getAccessToken = () => {
  return inMemoryToken || window.__HOTELPRO_ACCESS_TOKEN__;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // Enables cookie transmission for HttpOnly refresh tokens
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request Interceptor: Attach in-memory bearer access token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error extraction and attempt single token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized for expired access token (avoid loop for auth endpoints)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data?.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
      } finally {
        isRefreshing = false;
      }
    }

    let message = error.response?.data?.message;
    if (!message) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = `Network Error: Unable to communicate with HotelPro backend at ${API_BASE_URL}. Ensure the backend is active and CORS permits your origin.`;
      } else {
        message = error.message || 'An unexpected error occurred.';
      }
    }

    const formattedError = {
      message,
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || []
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
export { API_BASE_URL };
