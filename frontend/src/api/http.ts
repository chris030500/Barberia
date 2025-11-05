// src/api/http.ts
import axios, { AxiosError, AxiosInstance, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@/stores/auth";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

function ensureHeaders(h: InternalAxiosRequestConfig["headers"]) {
  return h instanceof AxiosHeaders ? h : new AxiosHeaders(h);
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuth.getState();
  if (accessToken) {
    const headers = ensureHeaders(config.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers; // 👈 ya es AxiosHeaders
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const flushQueue = (t: string | null) => { pendingQueue.forEach(cb => cb(t)); pendingQueue = []; };

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (!error.response || error.response.status !== 401 || original?._retry) throw error;
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          const headers = ensureHeaders(original.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          original.headers = headers;
          (api.request as any)(original).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const token = await useAuth.getState().refresh();
      flushQueue(token);

      const headers = ensureHeaders(original.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      original.headers = headers;

      return api.request(original);
    } catch (e) {
      flushQueue(null);
      await useAuth.getState().logout?.();
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

export const http = api;
export default api;
