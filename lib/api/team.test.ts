import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changeTeamMemberRole,
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  resendInvitation,
  revokeInvitation,
  type TeamMember,
} from "./team";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const member: TeamMember = {
  membershipId: "m1",
  userId: "u1",
  email: "ana@negocio.com",
  fullName: "Ana Ríos",
  role: "Admin",
  isPending: false,
  createdAt: "2026-09-01T12:00:00+00:00",
};

function stubJson(body: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

describe("team api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("lists members and pending invitations together", async () => {
    const fetchMock = stubJson([member]);

    await expect(listTeamMembers(tenantId)).resolves.toEqual([member]);
    expect(lastCall(fetchMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/members`);
  });

  it("invites a member and adapts the invitation summary into a pending team member", async () => {
    const fetchMock = stubJson(
      { membershipId: "m2", email: "new@negocio.com", role: "Agent", invitedAt: "2026-09-14T10:00:00+00:00" },
      201,
    );

    const invited = await inviteTeamMember(tenantId, "new@negocio.com", "Agent");

    expect(invited).toEqual({
      membershipId: "m2",
      userId: "",
      email: "new@negocio.com",
      fullName: "new@negocio.com",
      role: "Agent",
      isPending: true,
      createdAt: "2026-09-14T10:00:00+00:00",
    });
    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/invitations`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ email: "new@negocio.com", role: "Agent" });
  });

  it("resends a pending invitation", async () => {
    const fetchMock = stubJson({
      membershipId: "m2",
      email: "new@negocio.com",
      role: "Agent",
      invitedAt: "2026-09-15T10:00:00+00:00",
    });

    await resendInvitation(tenantId, "m2");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/invitations/m2/resend`);
    expect(init.method).toBe("POST");
  });

  it("revokes a pending invitation", async () => {
    const fetchMock = stubJson(null, 204);

    await revokeInvitation(tenantId, "m2");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/invitations/m2`);
    expect(init.method).toBe("DELETE");
  });

  it("changes a member's role", async () => {
    const fetchMock = stubJson({ ...member, role: "Viewer" });

    await changeTeamMemberRole(tenantId, "m1", "Viewer");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/members/m1/role`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ role: "Viewer" });
  });

  it("removes a member", async () => {
    const fetchMock = stubJson(null, 204);

    await removeTeamMember(tenantId, "m1");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/members/m1`);
    expect(init.method).toBe("DELETE");
  });
});
