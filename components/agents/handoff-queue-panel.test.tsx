import { ToastProvider } from "@/components/ui/toast";
import type { Handoff } from "@/lib/api/handoffs";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatWaitingSince, HandoffQueuePanel } from "./handoff-queue-panel";

const listHandoffs = vi.fn();
const returnToAssistant = vi.fn();

vi.mock("@/lib/api/handoffs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/handoffs")>();
  return {
    ...actual,
    listHandoffs: (...args: unknown[]) => listHandoffs(...args),
    returnToAssistant: (...args: unknown[]) => returnToAssistant(...args),
  };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

function handoff(overrides: Partial<Handoff> = {}): Handoff {
  return {
    conversationId: "c1",
    contactId: "k1",
    contactName: "Laura Gómez",
    reason: "CustomerAsked",
    requestedAt: new Date().toISOString(),
    summary: "Pidió una devolución fuera de plazo y quiere hablar con alguien.",
    lastMessageAt: null,
    lastMessagePreview: "Listo: dejo de responderte yo.",
    ...overrides,
  };
}

function page(items: Handoff[], extra: { nextCursor?: string | null; total?: number } = {}) {
  return { items, nextCursor: extra.nextCursor ?? null, total: extra.total ?? items.length };
}

function renderPanel(canReturn = true) {
  render(
    <ToastProvider>
      <HandoffQueuePanel tenantId={tenantId} canReturn={canReturn} />
    </ToastProvider>,
  );
}

describe("formatWaitingSince", () => {
  const now = new Date("2026-09-16T12:00:00Z");

  it("reads as a wait, not as a date", () => {
    expect(formatWaitingSince("2026-09-16T11:59:40Z", now)).toBe("Recién ahora");
    expect(formatWaitingSince("2026-09-16T11:59:00Z", now)).toBe("Hace 1 minuto");
    expect(formatWaitingSince("2026-09-16T11:30:00Z", now)).toBe("Hace 30 minutos");
    expect(formatWaitingSince("2026-09-16T09:00:00Z", now)).toBe("Hace 3 horas");
    expect(formatWaitingSince("2026-09-14T12:00:00Z", now)).toBe("Hace 2 días");
  });
});

describe("HandoffQueuePanel", () => {
  beforeEach(() => {
    listHandoffs.mockReset().mockResolvedValue(page([]));
    returnToAssistant.mockReset().mockResolvedValue(undefined);
  });

  it("says nobody is waiting instead of showing an empty list", async () => {
    renderPanel();

    expect(await screen.findByText("Nadie está esperando")).toBeInTheDocument();
  });

  it("says plainly that the customer is getting no answer meanwhile", async () => {
    listHandoffs.mockResolvedValue(page([handoff()]));
    renderPanel();

    expect(await screen.findByText(/el cliente no recibe respuesta/i)).toBeInTheDocument();
  });

  it("shows who is waiting, why, and what happened", async () => {
    listHandoffs.mockResolvedValue(page([handoff()]));
    renderPanel();

    expect(await screen.findByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.getByText("Pidió hablar con una persona")).toBeInTheDocument();
    expect(screen.getByText(/Pidió una devolución fuera de plazo/)).toBeInTheDocument();
  });

  it("renders a contact the API sent without a name", async () => {
    listHandoffs.mockResolvedValue(page([handoff({ contactName: null })]));
    renderPanel();

    expect(await screen.findByText("Contacto sin nombre")).toBeInTheDocument();
  });

  it("says nothing about a reason it does not know, instead of inventing one", async () => {
    listHandoffs.mockResolvedValue(page([handoff({ reason: "SomethingNew" })]));
    renderPanel();

    expect(await screen.findByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.queryByText(/SomethingNew/)).not.toBeInTheDocument();
  });

  it("treats a missing summary as «not yet», not as «there is none»", async () => {
    listHandoffs.mockResolvedValue(page([handoff({ summary: null })]));
    renderPanel();

    expect(await screen.findByText("Preparando el resumen de la conversación…")).toBeInTheDocument();
  });

  it("hands a conversation back to the assistant and takes it off the queue", async () => {
    const user = userEvent.setup();
    listHandoffs.mockResolvedValue(page([handoff(), handoff({ conversationId: "c2", contactName: "Iván" })]));
    renderPanel();

    const list = await screen.findByRole("list", { name: "Conversaciones en espera" });
    const first = within(list).getAllByRole("listitem")[0];
    await user.click(within(first).getByRole("button", { name: "Que la retome el asistente" }));

    await waitFor(() => expect(returnToAssistant).toHaveBeenCalledWith(tenantId, "c1"));
    expect(screen.queryByText("Laura Gómez")).not.toBeInTheDocument();
    expect(screen.getByText("Iván")).toBeInTheDocument();
  });

  it("does not offer to hand it back to someone who cannot", async () => {
    listHandoffs.mockResolvedValue(page([handoff()]));
    renderPanel(false);

    await screen.findByText("Laura Gómez");
    expect(screen.queryByRole("button", { name: "Que la retome el asistente" })).not.toBeInTheDocument();
  });

  it("says how many are waiting in total, not just on screen", async () => {
    listHandoffs.mockResolvedValue(page([handoff()], { nextCursor: "next", total: 8 }));
    renderPanel();

    expect(await screen.findByText(/8 conversaciones esperando/)).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1/)).toBeInTheDocument();
  });

  it("loads the next page with the cursor the API gave", async () => {
    const user = userEvent.setup();
    listHandoffs
      .mockResolvedValueOnce(page([handoff()], { nextCursor: "next", total: 2 }))
      .mockResolvedValueOnce(page([handoff({ conversationId: "c2", contactName: "Iván" })], { total: 2 }));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Ver más" }));

    await waitFor(() => expect(listHandoffs).toHaveBeenLastCalledWith(tenantId, { cursor: "next" }));
    expect(await screen.findByText("Iván")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
  });

  it("offers a retry when the queue cannot be read", async () => {
    listHandoffs.mockRejectedValue(new Error("network"));
    renderPanel();

    expect(await screen.findByText("No pudimos cargar las conversaciones en espera")).toBeInTheDocument();
  });

  it("explains a failed hand back in Spanish and keeps it on the queue", async () => {
    const user = userEvent.setup();
    listHandoffs.mockResolvedValue(page([handoff()]));
    returnToAssistant.mockRejectedValue(new Error("network"));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Que la retome el asistente" }));

    expect(
      await screen.findByText("No pudimos conectar con el servidor. Revisa tu conexión."),
    ).toBeInTheDocument();
    expect(screen.getByText("Laura Gómez")).toBeInTheDocument();
  });
});
