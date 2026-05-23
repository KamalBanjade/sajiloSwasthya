import axios from 'axios';
import axiosRetry from 'axios-retry';
import Cookies from 'js-cookie';

const isBrowser = typeof window !== 'undefined';
// In the browser, use a relative path so requests automatically go to the Next.js proxy
// on whatever host/port the user is currently visiting (e.g. localhost:3000 or 192.168.x.x:3000).
// In SSR (server-side), we must use an absolute URL.
const API_URL = isBrowser 
    ? '/api' 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api');

const isProduction = process.env.NODE_ENV === 'production';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: isProduction ? 15000 : 30000,
    withCredentials: true, // Required for sending/receiving cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Retry configuration: handles transient local network errors
axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // 1s, 2s, 3s back-off
    },
    retryCondition: (error) => {
        // Retry on network errors or server errors
        const status = error.response?.status;
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               status === 502 || 
               status === 504;
    },
});

// Request interceptor for logging & Authentication
axiosInstance.interceptors.request.use(
    (config) => {
        // Primary: read JWT from HTTP-only cookie (set by the backend on login).
        // Fallback: read from localStorage persisted store if cookie is unavailable
        // (e.g. cross-origin requests where SameSite=Strict blocks the cookie).
        let token = Cookies.get('auth_token');
        
        if (!token) {
            try {
                const rawStorage = localStorage.getItem('auth-storage');
                if (rawStorage) {
                    const parsed = JSON.parse(rawStorage);
                    token = parsed.state?.token || parsed.state?.Token;
                    
                    if (!isProduction) {
                        console.info(`[API Auth] Persistent token found in localStorage: ${token ? 'YES' : 'NO'}`);
                    }
                } else {
                    if (!isProduction) {
                        console.warn("[API Auth] localStorage('auth-storage') is empty");
                    }
                }
            } catch (e) {
                console.error("[API Auth] Error reading persistent token", e);
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (!isProduction) {
                console.info(`[API Auth] Header attached (ID: ${token.substring(0, 8)}...)`);
            }
        } else {
            // Only log an error if this is a request that REQUIRES authentication.
            // auth/user is often called on page load to see IF we are logged in.
            const isBackgroundAuthCall = config.url?.includes('auth/user');
            if (!isProduction) {
                if (isBackgroundAuthCall) {
                    console.info(`[API Auth Trace] No token for background check ${config.url}. Expected if not logged in.`);
                } else {
                    console.warn(`[API Auth] No token found for ${config.url}. Request may fail with 401 if unauthorized.`);
                }
            }
        }

        if (!isProduction) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        if (!isProduction) {
            console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            const url = error.config?.url || '';
            const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
            // Never auto-redirect for background auth-check (auth/user) or logout calls.
            // logout() handles its own redirect; checkAuth() handles its own failure silently.
            const isBackgroundAuthCall = url.includes('auth/user') || url.includes('auth/logout');

            if (typeof window !== 'undefined' && !isLoginPage && !isBackgroundAuthCall) {
                window.location.href = '/login?expired=true';
            }
        }

        if (!isProduction) {
            const url = error.config?.url || '';
            const isExpectedAuthCall = url.includes('auth/user') || url.includes('auth/logout');
            // Don't clutter the console with expected 401s from background auth checks
            if (!isExpectedAuthCall || status !== 401) {
                console.error(`[API Error] ${status || 'Network Error'} ${error.config?.url}`, error.response?.data);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
