import { ToastProvider } from "@/components/ui/toast";
import type { ChannelAccount } from "@/lib/api/channels";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChannelsPanel } from "./channels-panel";

const { listChannels, verifyChannel, disconnectChannel } = vi.hoisted(() => ({
  listChannels: vi.fn(),
  verifyChannel: vi.fn(),
  disconnectChannel: vi.fn(),
}));

vi.mock("@/lib/api/channels", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/channels")>("@/lib/api/channels")),
  listChannels: (...args: unknown[]) => listChannels(...args),
  verifyChannel: (...args: unknown[]) => verifyChannel(...args),
  disconnectChannel: (...args: unknown[]) => disconnectChannel(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

function whatsapp(overrides: Partial<ChannelAccount> = {}): ChannelAccount {
  return {
    id: "c1",
    kind: "WhatsApp",
    displayName: "Panadería La Espiga",
    externalId: "573001234567",
    status: "Connected",
    tokenExpiresAt: null,
    expiresSoon: false,
    createdAt: "2026-09-01T12:00:00+00:00",
    ...overrides,
  };
}

function renderPanel(viewerRole: "Owner" | "Admin" | "Agent" | "Viewer" = "Owner") {
  return render(
    <ToastProvider>
      <ChannelsPanel tenantId={tenantId} viewerRole={viewerRole} />
    </ToastProvider>,
  );
}

describe("ChannelsPanel", () => {
  beforeEach(() => {
    listChannels.mockReset();
    verifyChannel.mockReset();
    disconnectChannel.mockReset();
  });

  it("shows the empty state with a connect button for someone who can manage channels", async () => {
    listChannels.mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText("Aún no hay canales conectados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conectar WhatsApp" })).toBeInTheDocument();
  });

  it("hides the connect button for a role without ManageChannels", async () => {
    listChannels.mockResolvedValue([]);
    renderPanel("Agent");

    await screen.findByText("Aún no hay canales conectados");
    expect(screen.queryByRole("button", { name: "Conectar WhatsApp" })).not.toBeInTheDocument();
  });

  it("lists a connected channel with its status", async () => {
    listChannels.mockResolvedValue([whatsapp()]);
    renderPanel();

    expect(await screen.findByText("Panadería La Espiga")).toBeInTheDocument();
    expect(screen.getByText("Conectado")).toBeInTheDocument();
  });

  it("flags a channel whose token expires soon", async () => {
    listChannels.mockResolvedValue([whatsapp({ expiresSoon: true })]);
    renderPanel();

    expect(await screen.findByText("Vence pronto")).toBeInTheDocument();
  });

  it("retries verification for a pending channel", async () => {
    const user = userEvent.setup();
    listChannels.mockResolvedValue([whatsapp({ status: "PendingVerification" })]);
    verifyChannel.mockResolvedValue(whatsapp({ status: "Connected" }));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Verificar" }));

    expect(verifyChannel).toHaveBeenCalledWith(tenantId, "c1");
    expect(await screen.findByText("Conectado")).toBeInTheDocument();
  });

  it("disconnects a channel after confirming", async () => {
    const user = userEvent.setup();
    listChannels.mockResolvedValue([whatsapp()]);
    disconnectChannel.mockResolvedValue(undefined);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Desconectar" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Desconectar" }));

    expect(disconnectChannel).toHaveBeenCalledWith(tenantId, "c1");
  });
});
