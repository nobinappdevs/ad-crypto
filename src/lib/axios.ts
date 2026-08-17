import axios from "axios";
import { env } from "@/config/env";
import { TOKEN_KEY, clearAuthState } from "@/lib/authState";

/** Re-exported so the existing `from "@/lib/axios"` imports keep working. */
export { TOKEN_KEY };

const commonHeaders = { "Content-Type": "application/json", Accept: "application/json" };

/** No auth, no interceptors - login, register, forgot-password, public content. */
export const publicApi = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });

/** Auto-attaches the bearer token; handles 401. */
export const privateApi = axios.create({ baseURL: env.apiUrl, headers: commonHeaders });

privateApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * This API answers a missing or expired token with HTTP **400** and an
 * explanatory message — not the 401 the status code exists for. So the status
 * alone cannot identify a dead session, and treating every 400 as one would be
 * far worse than missing them: "Verification code does not match" is also a 400,
 * and it would sign the user out in the middle of the flow that was working.
 *
 * A 400 therefore has to say so in words. The phrasing is the backend's
 * ("You are not authorized to access this resource. Please log in to continue.");
 * matching loosely on it survives small rewordings, and a genuine 401 from any
 * other layer still counts.
 */
const UNAUTHORIZED = /not authori[sz]ed|unauthenticated|log in to continue/i;

function isSessionDead(error: { response?: { status?: number; data?: { message?: unknown } } }) {
  const status = error.response?.status;
  if (status === 401) return true;
  if (status !== 400) return false;
  // Stringified rather than walked: the message nests differently per endpoint
  // and all we need to know is whether those words appear anywhere in it.
  return UNAUTHORIZED.test(JSON.stringify(error.response?.data?.message ?? ""));
}

privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && isSessionDead(error)) {
      clearAuthState();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
