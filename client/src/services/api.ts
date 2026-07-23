import axios from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

const LOCAL_API_URL = 'http://127.0.0.1:5164/api/v1';
const PRODUCTION_API_URL = 'https://smartsport-api.onrender.com/api/v1';

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);

export const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const GET_CACHE_TTL_MS = 30_000;
const MAX_GET_CACHE_ITEMS = 80;
const getCache = new Map<string, { expiresAt: number; data: unknown }>();

const isCacheableGet = (config: InternalAxiosRequestConfig) => {
  if ((config.method || 'get').toLowerCase() !== 'get') return false;

  const url = String(config.url || '').toLowerCase();
  return ![
    '/payments/',
    '/auth/refresh',
    '/ai/',
  ].some((blocked) => url.includes(blocked));
};

const stableParams = (params: unknown) => {
  if (!params || typeof params !== 'object') return '';

  return Object.entries(params as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('&');
};

const getCacheKey = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token') || 'public';
  return `${token}:${config.baseURL || ''}:${config.url || ''}?${stableParams(config.params)}`;
};

const pruneGetCache = () => {
  const now = Date.now();
  for (const [key, item] of getCache) {
    if (item.expiresAt <= now) getCache.delete(key);
  }

  while (getCache.size > MAX_GET_CACHE_ITEMS) {
    const firstKey = getCache.keys().next().value;
    if (!firstKey) break;
    getCache.delete(firstKey);
  }
};

export const clearApiCache = () => getCache.clear();

// Interceptor to add Auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!isCacheableGet(config)) {
    if ((config.method || 'get').toLowerCase() !== 'get') clearApiCache();
    return config;
  }

  pruneGetCache();
  const cacheKey = getCacheKey(config);
  const cached = getCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    const cachedAdapter: AxiosAdapter = async () => ({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: null,
    });

    config.adapter = cachedAdapter;
    return config;
  }

  config.headers['x-smartsport-cache-key'] = cacheKey;
  return config;
});

// Interceptor to handle unified ApiResponse format and global errors
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    const cacheKey = response.config.headers?.['x-smartsport-cache-key'];
    if (typeof cacheKey === 'string') {
      getCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
      });
      pruneGetCache();
    }

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
      clearApiCache();
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
