const TENANT_KEY = "orbita.lastTenantId";

/**
 * The organization this browser used last. Only a preference for people who belong to
 * several: who you are and where you may work comes from `GET /api/auth/me`.
 */
export function readLastTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TENANT_KEY);
}

export function writeLastTenantId(tenantId: string): void {
  window.localStorage.setItem(TENANT_KEY, tenantId);
}

export function clearLocalSession(): void {
  window.localStorage.removeItem(TENANT_KEY);
}
