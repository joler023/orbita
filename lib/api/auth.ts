import type { components } from "./generated/schema";
import { apiRequest } from "./client";

export type RegisterOrganizationRequest = components["schemas"]["RegisterOrganizationRequest"];
export type RegisterOrganizationResult = components["schemas"]["RegisterOrganizationResult"];
export type LoginRequest = components["schemas"]["LoginRequest"];
export type CurrentUserResponse = components["schemas"]["CurrentUserResponse"];
export type CurrentUserIdResponse = components["schemas"]["CurrentUserIdResponse"];
export type TenantDto = components["schemas"]["TenantDto"];

export function registerOrganization(
  body: RegisterOrganizationRequest,
): Promise<RegisterOrganizationResult> {
  return apiRequest<RegisterOrganizationResult>("/api/organizations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: LoginRequest): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function refreshSession(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>("/api/auth/refresh", { method: "POST" }, { retry: false });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/api/auth/logout", { method: "POST" }, { retry: false });
}

export const MEMBER_ROLES = ["Owner", "Admin", "Agent", "Viewer"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export type Membership = {
  tenantId: string;
  slug: string;
  name: string;
  role: MemberRole;
};

/**
 * Who is signed in and where they can work. Only accepted, active memberships come back,
 * already sorted by name, so an empty list means "no organization yet" rather than an error.
 */
export type CurrentUser = {
  userId: string;
  email: string;
  fullName: string;
  memberships: Membership[];
};

export function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>("/api/auth/me");
}

/** Roles that may configure the assistants (ORB-A08's ManageAiAgents). */
export function canManageAiAgents(role: MemberRole): boolean {
  return role === "Owner" || role === "Admin";
}

export function requestPasswordReset(email: string): Promise<void> {
  return apiRequest<void>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiRequest<void>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getTenant(tenantId: string): Promise<TenantDto> {
  return apiRequest<TenantDto>(`/api/tenants/${tenantId}`);
}
