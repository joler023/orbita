import { ToastProvider } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { TeamMember } from "@/lib/api/team";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamPanel } from "./team-panel";

const { listTeamMembers, inviteTeamMember, resendInvitation, revokeInvitation, changeTeamMemberRole, removeTeamMember } =
  vi.hoisted(() => ({
    listTeamMembers: vi.fn(),
    inviteTeamMember: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    changeTeamMemberRole: vi.fn(),
    removeTeamMember: vi.fn(),
  }));

vi.mock("@/lib/api/team", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/team")>("@/lib/api/team")),
  listTeamMembers: (...args: unknown[]) => listTeamMembers(...args),
  inviteTeamMember: (...args: unknown[]) => inviteTeamMember(...args),
  resendInvitation: (...args: unknown[]) => resendInvitation(...args),
  revokeInvitation: (...args: unknown[]) => revokeInvitation(...args),
  changeTeamMemberRole: (...args: unknown[]) => changeTeamMemberRole(...args),
  removeTeamMember: (...args: unknown[]) => removeTeamMember(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

function owner(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    membershipId: "m1",
    userId: "u1",
    email: "ana@negocio.com",
    fullName: "Ana Ríos",
    role: "Owner",
    isPending: false,
    createdAt: "2026-09-01T12:00:00+00:00",
    ...overrides,
  };
}

function renderPanel(viewerRole: TeamMember["role"] = "Owner") {
  return render(
    <ToastProvider>
      <TeamPanel tenantId={tenantId} viewerRole={viewerRole} />
    </ToastProvider>,
  );
}

describe("TeamPanel", () => {
  beforeEach(() => {
    listTeamMembers.mockReset();
    inviteTeamMember.mockReset();
    resendInvitation.mockReset();
    revokeInvitation.mockReset();
    changeTeamMemberRole.mockReset();
    removeTeamMember.mockReset();
  });

  it("shows an empty-team message when nobody else has been invited yet", async () => {
    listTeamMembers.mockResolvedValue([owner()]);
    renderPanel();

    expect(await screen.findByText("Todavía es solo tu organización")).toBeInTheDocument();
  });

  it("invites a new member from the modal", async () => {
    const user = userEvent.setup();
    listTeamMembers.mockResolvedValue([owner()]);
    inviteTeamMember.mockResolvedValue({
      membershipId: "m2",
      userId: "",
      email: "nuevo@negocio.com",
      fullName: "nuevo@negocio.com",
      role: "Agent",
      isPending: true,
      createdAt: "2026-09-14T10:00:00+00:00",
    });
    renderPanel();
    await screen.findByText("Todavía es solo tu organización");

    await user.click(screen.getByRole("button", { name: "Invitar" }));
    await user.type(screen.getByLabelText("Correo"), "nuevo@negocio.com");
    await user.click(screen.getByRole("button", { name: "Enviar invitación" }));

    expect(inviteTeamMember).toHaveBeenCalledWith(tenantId, "nuevo@negocio.com", "Agent");
    expect(await screen.findByText("Invitación pendiente")).toBeInTheDocument();
  });

  it("shows a permission state on a 403", async () => {
    listTeamMembers.mockRejectedValue(new ApiError(403, "Forbidden", "Forbidden"));
    renderPanel("Agent");

    expect(await screen.findByText("Necesitas permiso para ver el equipo")).toBeInTheDocument();
  });

  it("hides management actions for a viewer without ManageTeam", async () => {
    listTeamMembers.mockResolvedValue([owner(), owner({ membershipId: "m2", fullName: "Beto", role: "Agent" })]);
    renderPanel("Agent");

    await screen.findByText("Beto");
    expect(screen.queryByRole("button", { name: "Invitar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar" })).not.toBeInTheDocument();
  });

  it("removes a member after confirming", async () => {
    const user = userEvent.setup();
    listTeamMembers.mockResolvedValue([owner(), owner({ membershipId: "m2", fullName: "Beto", role: "Agent" })]);
    removeTeamMember.mockResolvedValue(undefined);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Quitar" }));
    await user.click(screen.getByRole("button", { name: "Quitar del equipo" }));

    expect(removeTeamMember).toHaveBeenCalledWith(tenantId, "m2");
  });
});
