import axios, { type AxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_INTERNAL_API_KEY;

if (!baseURL) {
  throw new Error("VITE_API_BASE_URL が設定されていません。");
}

if (!apiKey) {
  throw new Error("VITE_INTERNAL_API_KEY が設定されていません。");
}

export const httpClient = axios.create({
  baseURL,
  headers: {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  config.headers.set("x-api-key", apiKey);
  config.headers.set("Content-Type", "application/json");
  return config;
});

export const getApiErrorMessage = (error: unknown): string => {
  const fallbackMessage = "通信に失敗しました。";

  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message ?? fallbackMessage;
};
