import { apiRequest } from "./client";
import type { MemberRole } from "./auth";

export type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  isPending: boolean;
  createdAt: string;
};

function teamPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/members`;
}

function invitationsPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/invitations`;
}

type TeamInvitationSummary = {
  membershipId: string;
  email: string;
  role: MemberRole;
  invitedAt: string;
};

export function listTeamMembers(tenantId: string): Promise<TeamMember[]> {
  return apiRequest<TeamMember[]>(teamPath(tenantId));
}

export function inviteTeamMember(
  tenantId: string,
  email: string,
  role: MemberRole,
): Promise<TeamMember> {
  return apiRequest<TeamInvitationSummary>(invitationsPath(tenantId), {
    method: "POST",
    body: JSON.stringify({ email, role }),
  }).then(toTeamMember);
}

export function resendInvitation(tenantId: string, membershipId: string): Promise<TeamMember> {
  return apiRequest<TeamInvitationSummary>(`${invitationsPath(tenantId)}/${membershipId}/resend`, {
    method: "POST",
  }).then(toTeamMember);
}

export function revokeInvitation(tenantId: string, membershipId: string): Promise<void> {
  return apiRequest<void>(`${invitationsPath(tenantId)}/${membershipId}`, { method: "DELETE" });
}

export function changeTeamMemberRole(
  tenantId: string,
  membershipId: string,
  role: MemberRole,
): Promise<TeamMember> {
  return apiRequest<TeamMember>(`${teamPath(tenantId)}/${membershipId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeTeamMember(tenantId: string, membershipId: string): Promise<void> {
  return apiRequest<void>(`${teamPath(tenantId)}/${membershipId}`, { method: "DELETE" });
}

/**
 * `POST /invitations` responds with a `TeamInvitationSummary` (no `userId`/`isPending`
 * — the invited person may not have an account yet), while everywhere else this module
 * deals in `TeamMember` (from the combined members+invitations list). This adapts the
 * invite/resend response into the same shape so the panel only ever renders one type.
 */
function toTeamMember(summary: TeamInvitationSummary): TeamMember {
  return {
    membershipId: summary.membershipId,
    userId: "",
    email: summary.email,
    fullName: summary.email,
    role: summary.role,
    isPending: true,
    createdAt: summary.invitedAt,
  };
}
