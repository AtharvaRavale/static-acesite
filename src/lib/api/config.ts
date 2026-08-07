const API_BASE_URL_ENV = "VITE_API_BASE_URL";

function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const value = import.meta.env[API_BASE_URL_ENV];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${API_BASE_URL_ENV} is required. Point it to the active backend, for example http://localhost:8000/api.`
    );
  }

  return normalizeApiBaseUrl(value);
}

export const API_BASE_URL = getApiBaseUrl();
