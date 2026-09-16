import { ToastProvider } from "@/components/ui/toast";
import type { ChannelAccount } from "@/lib/api/channels";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectWhatsAppModal } from "./connect-whatsapp-modal";

const { getMetaAppId, getMetaConfigId } = vi.hoisted(() => ({
  getMetaAppId: vi.fn(),
  getMetaConfigId: vi.fn(),
}));
const { startWhatsAppEmbeddedSignup } = vi.hoisted(() => ({
  startWhatsAppEmbeddedSignup: vi.fn(),
}));
const { connectWhatsApp } = vi.hoisted(() => ({ connectWhatsApp: vi.fn() }));

vi.mock("@/lib/api/config", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/config")>("@/lib/api/config")),
  getMetaAppId: () => getMetaAppId(),
  getMetaConfigId: () => getMetaConfigId(),
}));
vi.mock("@/lib/meta/embedded-signup", () => ({
  startWhatsAppEmbeddedSignup: (...args: unknown[]) => startWhatsAppEmbeddedSignup(...args),
}));
vi.mock("@/lib/api/channels", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/channels")>("@/lib/api/channels")),
  connectWhatsApp: (...args: unknown[]) => connectWhatsApp(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

const account: ChannelAccount = {
  id: "c1",
  kind: "WhatsApp",
  externalId: "573001234567",
  displayName: "Panadería La Espiga",
  phoneE164: "+573001234567",
  status: "Connected",
  connectedAt: "2026-09-01T12:00:00+00:00",
  tokenExpiresAt: null,
  expiresSoon: false,
};

function renderModal(onConnected = vi.fn()) {
  return {
    onConnected,
    ...render(
      <ToastProvider>
        <ConnectWhatsAppModal open tenantId={tenantId} onClose={vi.fn()} onConnected={onConnected} />
      </ToastProvider>,
    ),
  };
}

describe("ConnectWhatsAppModal", () => {
  beforeEach(() => {
    getMetaAppId.mockReset();
    getMetaConfigId.mockReset();
    startWhatsAppEmbeddedSignup.mockReset();
    connectWhatsApp.mockReset();
  });

  it("shows a not-configured state when the Meta app id is missing", () => {
    getMetaAppId.mockReturnValue(null);
    getMetaConfigId.mockReturnValue(null);
    renderModal();

    expect(screen.getByText(/Todavía no configuramos la app de Meta/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Conectar con Facebook" })).not.toBeInTheDocument();
  });

  it("runs the embedded signup and connects the account when configured", async () => {
    const user = userEvent.setup();
    getMetaAppId.mockReturnValue("app-id");
    getMetaConfigId.mockReturnValue("config-id");
    startWhatsAppEmbeddedSignup.mockResolvedValue({ code: "auth-code", wabaId: "waba1", phoneNumberId: "phone1" });
    connectWhatsApp.mockResolvedValue(account);
    const { onConnected } = renderModal();

    await user.click(screen.getByRole("button", { name: "Conectar con Facebook" }));

    expect(startWhatsAppEmbeddedSignup).toHaveBeenCalledWith("app-id", "config-id");
    expect(connectWhatsApp).toHaveBeenCalledWith(tenantId, {
      code: "auth-code",
      wabaId: "waba1",
      phoneNumberId: "phone1",
    });
    expect(onConnected).toHaveBeenCalledWith(account);
  });

  it("shows an error when the signup popup fails", async () => {
    const user = userEvent.setup();
    getMetaAppId.mockReturnValue("app-id");
    getMetaConfigId.mockReturnValue("config-id");
    startWhatsAppEmbeddedSignup.mockRejectedValue(new Error("Cancelaste la conexión antes de terminar."));
    renderModal();

    await user.click(screen.getByRole("button", { name: "Conectar con Facebook" }));

    expect(await screen.findByText("Cancelaste la conexión antes de terminar.")).toBeInTheDocument();
  });
});
