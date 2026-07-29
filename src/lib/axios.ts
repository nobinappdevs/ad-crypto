import axios from "axios";
import { env } from "@/config/env";

/** localStorage key for the bearer token - imported everywhere, never retyped. */
export const TOKEN_KEY = "adcrypto_token";

const commonHeaders = { "Content-Type": "application/json", Accept: "application/json" };

/** No auth, no interceptors - login, register, public content. */
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

privateApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
