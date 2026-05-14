import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5164/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unified ApiResponse format and global errors
api.interceptors.response.use(
  (response) => {
    const { data } = response;

    const withDataAlias = (payload: any) => {
      if (payload && (typeof payload === 'object' || typeof payload === 'function')) {
        if (!Object.prototype.hasOwnProperty.call(payload, 'data')) {
          Object.defineProperty(payload, 'data', {
            value: payload,
            enumerable: false,
            configurable: true,
          });
        }
        return payload;
      }

      return { data: payload, value: payload };
    };
    
    // Check if response follows the unified format { success, message, data }
    if (data && typeof data.success === 'boolean') {
      if (data.success) {
        return withDataAlias(data.data);
      } else {
        // If success is false, reject with the error message/details
        return Promise.reject({
          message: data.message || 'Operation failed',
          errors: data.errors,
          status: response.status
        });
      }
    }
    
    // Fallback for non-unified responses
    return withDataAlias(data);
  },
  (error) => {
    // Handle HTTP errors
    const status = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Prepare a clean error object
    const errorResult = {
      message: responseData?.message || error.message || 'An unexpected error occurred',
      errors: responseData?.errors || null,
      status: status
    };

    return Promise.reject(errorResult);
  }
);

export default api;
