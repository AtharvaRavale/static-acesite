import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback = "Request failed."): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 403) {
      return "Platform superuser access is required for this action.";
    }
    if (error.response?.status === 404) {
      return getApiNotFoundEndpointMessage(error);
    }

    const data = error.response?.data;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") {
        return data.detail;
      }
      const fieldMessages = Object.entries(data as Record<string, unknown>)
        .map(([field, value]) => {
          if (Array.isArray(value)) {
            return `${field}: ${value.join(", ")}`;
          }
          if (typeof value === "string") {
            return `${field}: ${value}`;
          }
          return null;
        })
        .filter(Boolean);
      if (fieldMessages.length > 0) {
        return fieldMessages.join(" ");
      }
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") {
    return {};
  }

  const data = error.response.data as Record<string, unknown>;
  const fields: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "detail" || key === "non_field_errors") continue;
    if (Array.isArray(value)) {
      fields[key] = value.map(String).join(", ");
    } else if (typeof value === "string") {
      fields[key] = value;
    }
  }

  return fields;
}

export function getApiNotFoundEndpointMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    const base = error.config?.baseURL ?? "";
    const path = error.config?.url ?? "unknown";
    const url = `${base}${path}`.replace(/([^:]\/)\/+/g, "$1");
    return `Backend endpoint not found: ${url}`;
  }
  return getApiErrorMessage(error, "Backend endpoint not found.");
}
