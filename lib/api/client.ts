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

const DEFAULT_TIMEOUT_MS = 4_000;

let refreshInFlight: Promise<void> | null = null;

export type ApiRequestOptions = {
  retry?: boolean;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const retry = options.retry ?? true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener("abort", abortFromCaller);
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(0, "Unexpected error", "timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }

  if (response.status === 401 && retry && shouldRefresh(path)) {
    await refreshSessionOnce();
    return apiRequest<T>(path, init, { ...options, retry: false });
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

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
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
