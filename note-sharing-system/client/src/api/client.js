import axios from 'axios';

/**
 * Shared axios instance for every API call.
 *  - baseURL: Vite proxies /api -> Express in development
 *  - withCredentials: sends the httpOnly JWT cookie with each request
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Extract a readable error message (and field errors) from any API failure.
 * The server always answers with { success, data, message, errors? }.
 */
export const getApiError = (error) => {
  const data = error.response?.data;
  return {
    message: data?.message || error.message || 'Something went wrong',
    status: error.response?.status,
    errors: data?.errors || [], // [{ field, message }]
  };
};

export default api;
