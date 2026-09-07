import { apiRequest } from "./client";

export type TeamMemberSummary = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  isPending: boolean;
  createdAt: string;
};

export function listTeamMembers(tenantId: string): Promise<TeamMemberSummary[]> {
  return apiRequest<TeamMemberSummary[]>(`/api/tenants/${tenantId}/members`);
}
