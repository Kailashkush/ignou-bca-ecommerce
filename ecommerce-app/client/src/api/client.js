/**
 * Axios instance shared by the whole application.
 *
 * Two interceptors do the work that would otherwise be repeated in every
 * component: attaching the bearer token on the way out, and turning the API's
 * error envelope into a plain `Error` with a readable message on the way back.
 */
import axios from 'axios';

/** Key under which the access token is kept. */
export const TOKEN_KEY = 'shopsphere.token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private browsing modes can make localStorage throw on access.
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — the session simply will not survive a reload */
  }
};

/**
 * Where the API lives.
 *
 * In development, and in any deployment that serves the client and the API from
 * one origin, a relative path is correct: the Vite dev proxy or the web server
 * forwards it. When the two are deployed as separate services — as they are on
 * Render — `VITE_API_BASE_URL` is set at build time to the API's own origin and
 * the requests become cross-origin, which the server's CORS policy admits for
 * exactly this one origin.
 */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Outgoing: attach the access token if one is stored. */
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Incoming: normalise failures.
 *
 * Every rejection handed to a component is an `Error` carrying `.message`
 * (safe to display), `.status` and `.details` (field-level validation errors),
 * so no component has to reach into `error.response.data` itself.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    let message = payload?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') {
        message = 'The request timed out. Please check your connection and try again.';
      } else if (!error.response) {
        message = 'Cannot reach the server. Please check that the API is running.';
      } else {
        message = 'Something went wrong. Please try again.';
      }
    }

    const normalised = new Error(message);
    normalised.status = status;
    normalised.details = payload?.details || [];

    // A 401 means the stored token is expired or invalid; drop it so the UI
    // falls back to the signed-out state instead of looping on failed calls.
    if (status === 401) setStoredToken(null);

    return Promise.reject(normalised);
  }
);

export default api;
