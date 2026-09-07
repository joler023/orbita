import type { components } from "./generated/schema";
import { getApiBaseUrl } from "./config";
import { ApiError, parseApiError } from "./errors";

const NO_REFRESH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/organizations",
]);

let refreshInFlight: Promise<void> | null = null;

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { retry?: boolean } = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4_000);
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(0, "Unexpected error", "timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && retry && shouldRefresh(path)) {
    await refreshSessionOnce();
    return apiRequest<T>(path, init, { retry: false });
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

function shouldRefresh(path: string): boolean {
  return !NO_REFRESH_PATHS.has(path);
}

async function refreshSessionOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = apiRequest<components["schemas"]["CurrentUserResponse"]>(
      "/api/auth/refresh",
      { method: "POST" },
      { retry: false },
    )
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  await refreshInFlight;
}

export function resetRefreshLock(): void {
  refreshInFlight = null;
}
