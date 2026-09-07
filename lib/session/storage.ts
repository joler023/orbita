export type SessionUser = {
  userId: string;
  email: string;
  fullName: string;
};

const SESSION_KEY = "orbita.session";
const TENANT_KEY = "orbita.lastTenantId";

export function readSessionUser(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSessionUser(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionUser(user: SessionUser): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function readLastTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TENANT_KEY);
}

export function writeLastTenantId(tenantId: string): void {
  window.localStorage.setItem(TENANT_KEY, tenantId);
}

export function clearLastTenantId(): void {
  window.localStorage.removeItem(TENANT_KEY);
}

export function clearLocalSession(): void {
  clearSessionUser();
  clearLastTenantId();
}

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === "string" &&
    typeof record.email === "string" &&
    typeof record.fullName === "string"
  );
}
