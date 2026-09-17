import { ToastProvider } from "@/components/ui/toast";
import type { AgentGuardrails, AiAgent } from "@/lib/api/ai-agents";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentGuardrailsPanel } from "./agent-guardrails-panel";

const saveAgentGuardrails = vi.fn();

vi.mock("@/lib/api/ai-agents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-agents")>();
  return { ...actual, saveAgentGuardrails: (...args: unknown[]) => saveAgentGuardrails(...args) };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

const guardrails: AgentGuardrails = {
  blockedTopics: ["dosis"],
  outOfScopeReply: "Eso lo ve alguien del equipo.",
  handoffReply: "Listo: dejo de responderte yo y la conversación queda para alguien del equipo.",
};

function renderPanel(overrides: Partial<AgentGuardrails> = {}) {
  const onSaved = vi.fn();
  render(
    <ToastProvider>
      <AgentGuardrailsPanel
        tenantId={tenantId}
        agentId="a1"
        guardrails={{ ...guardrails, ...overrides }}
        onSaved={onSaved}
      />
    </ToastProvider>,
  );
  return { onSaved };
}

describe("AgentGuardrailsPanel", () => {
  beforeEach(() => {
    saveAgentGuardrails.mockReset();
  });

  it("says the limits apply without publishing", () => {
    renderPanel();

    expect(screen.getByText(/empieza a regir apenas lo guardes/i)).toBeInTheDocument();
  });

  it("warns that matching is by whole word, so plurals need their own entry", () => {
    renderPanel();

    expect(screen.getByText(/palabra completa/i)).toBeInTheDocument();
  });

  it("keeps the save button off until something changes", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(screen.getByRole("button", { name: "Guardar límites" })).toBeDisabled();

    await user.type(screen.getByLabelText(/no hable/i), "descuento{Enter}");

    expect(screen.getByRole("button", { name: "Guardar límites" })).toBeEnabled();
  });

  it("sends both fields together and reports back the saved agent", async () => {
    const user = userEvent.setup();
    const saved = {
      id: "a1",
      guardrails: { ...guardrails, blockedTopics: ["dosis", "descuento"] },
    } as AiAgent;
    saveAgentGuardrails.mockResolvedValue(saved);
    const { onSaved } = renderPanel();

    await user.type(screen.getByLabelText(/no hable/i), "descuento{Enter}");
    await user.click(screen.getByRole("button", { name: "Guardar límites" }));

    await waitFor(() =>
      expect(saveAgentGuardrails).toHaveBeenCalledWith(tenantId, "a1", {
        blockedTopics: ["dosis", "descuento"],
        outOfScopeReply: guardrails.outOfScopeReply,
        handoffReply: guardrails.handoffReply,
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("refuses to save an empty reply and never calls the API", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.clear(screen.getByLabelText(/Qué responde/i));
    await user.click(screen.getByRole("button", { name: "Guardar límites" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Escribe qué responde tu asistente cuando no puede hablar de un tema.",
    );
    expect(saveAgentGuardrails).not.toHaveBeenCalled();
  });

  it("shows the failure in Spanish and keeps what the owner typed", async () => {
    const user = userEvent.setup();
    saveAgentGuardrails.mockRejectedValue(new Error("network"));
    renderPanel();

    await user.type(screen.getByLabelText(/no hable/i), "descuento{Enter}");
    await user.click(screen.getByRole("button", { name: "Guardar límites" }));

    expect(
      await screen.findByText("No pudimos conectar con el servidor. Revisa tu conexión."),
    ).toBeInTheDocument();
    expect(screen.getByText("descuento")).toBeInTheDocument();
  });

  it("lets the owner write what the customer reads when the team takes over", async () => {
    const user = userEvent.setup();
    saveAgentGuardrails.mockResolvedValue({
      id: "a1",
      guardrails: { ...guardrails, handoffReply: "Te escribe alguien del equipo." },
    } as AiAgent);
    renderPanel();

    const field = screen.getByLabelText(/pasa la conversación a tu equipo/);
    expect(field).toHaveValue(guardrails.handoffReply);

    await user.clear(field);
    await user.type(field, "Te escribe alguien del equipo.");
    await user.click(screen.getByRole("button", { name: "Guardar límites" }));

    await waitFor(() =>
      expect(saveAgentGuardrails).toHaveBeenCalledWith(tenantId, "a1", {
        ...guardrails,
        handoffReply: "Te escribe alguien del equipo.",
      }),
    );
  });

  it("warns that the owner must not promise a response time", () => {
    renderPanel();

    expect(screen.getByText(/No le prometas un tiempo de respuesta/)).toBeInTheDocument();
  });

  it("says a blocked topic also hands the conversation to the team", () => {
    renderPanel();

    expect(screen.getByText(/Después, la conversación queda para tu equipo\./)).toBeInTheDocument();
  });

  it("never shows model jargon", () => {
    const { container } = render(
      <ToastProvider>
        <AgentGuardrailsPanel
          tenantId={tenantId}
          agentId="a1"
          guardrails={guardrails}
          onSaved={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(container.textContent).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
