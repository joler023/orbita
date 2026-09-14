"use client";

import { getCurrentUser, type CurrentUser, type Membership } from "@/lib/api/auth";
import { createContext, useContext, type ReactNode } from "react";

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return user;
}

export function useMembership(tenantId: string): Membership | undefined {
  return useCurrentUser().memberships.find((membership) => membership.tenantId === tenantId);
}

/**
 * Where a person should land after signing in: the organization they used last when they
 * still belong to it, otherwise the first one. Null means they belong to none yet.
 */
export function landingTenantId(user: CurrentUser, lastTenantId: string | null): string | null {
  const remembered = user.memberships.find((membership) => membership.tenantId === lastTenantId);
  return remembered?.tenantId ?? user.memberships[0]?.tenantId ?? null;
}

export { getCurrentUser };
