import { ToastProvider } from "@/components/ui/toast";
import type { AgentGuardrails, AiAgent, BusinessHours } from "@/lib/api/ai-agents";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentGuardrailsPanel } from "./agent-guardrails-panel";

const saveAgentGuardrails = vi.fn();
const saveBusinessHours = vi.fn();

vi.mock("@/lib/api/ai-agents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/ai-agents")>();
  return {
    ...actual,
    saveAgentGuardrails: (...args: unknown[]) => saveAgentGuardrails(...args),
    saveBusinessHours: (...args: unknown[]) => saveBusinessHours(...args),
  };
});

const tenantId = "11111111-1111-4111-8111-111111111111";

const guardrails: AgentGuardrails = {
  blockedTopics: ["dosis"],
  outOfScopeReply: "Eso lo ve alguien del equipo.",
};

const weekdayMornings: BusinessHours = {
  slots: [{ day: "Monday", opens: "09:00:00", closes: "13:00:00" }],
  outsideHours: "AssistantAnswers",
};

function renderPanel(
  overrides: Partial<AgentGuardrails> = {},
  businessHours: BusinessHours | null = null,
) {
  const onSaved = vi.fn();
  render(
    <ToastProvider>
      <AgentGuardrailsPanel
        tenantId={tenantId}
        agentId="a1"
        guardrails={{ ...guardrails, ...overrides }}
        businessHours={businessHours}
        onSaved={onSaved}
      />
    </ToastProvider>,
  );
  return { onSaved };
}

describe("AgentGuardrailsPanel", () => {
  beforeEach(() => {
    saveAgentGuardrails.mockReset();
    saveBusinessHours.mockReset();
  });

  it("offers the two choices the design guide asks for", () => {
    renderPanel();

    expect(screen.getByRole("group", { name: "¿Cuándo trabaja?" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Siempre/ })).toBeChecked();
  });

  it("explains why the schedule option cannot be picked yet, instead of hiding it", () => {
    renderPanel();

    const blocked = screen.getByRole("radio", { name: /Solo fuera del horario laboral/ });
    expect(blocked).toBeDisabled();
    expect(blocked).toHaveAccessibleDescription("Llega cuando puedas definir el horario de tu negocio.");
  });

  it("puts an assistant that had a schedule back on duty at all hours", async () => {
    const user = userEvent.setup();
    saveBusinessHours.mockResolvedValue({ id: "a1", businessHours: null } as AiAgent);
    const { onSaved } = renderPanel({}, weekdayMornings);

    expect(screen.getByRole("radio", { name: /Solo fuera del horario laboral/ })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: /Siempre/ }));

    await waitFor(() => expect(saveBusinessHours).toHaveBeenCalledWith(tenantId, "a1", null));
    expect(onSaved).toHaveBeenCalled();
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
    const saved = { id: "a1", guardrails: { blockedTopics: ["dosis", "descuento"], outOfScopeReply: guardrails.outOfScopeReply } } as AiAgent;
    saveAgentGuardrails.mockResolvedValue(saved);
    const { onSaved } = renderPanel();

    await user.type(screen.getByLabelText(/no hable/i), "descuento{Enter}");
    await user.click(screen.getByRole("button", { name: "Guardar límites" }));

    await waitFor(() =>
      expect(saveAgentGuardrails).toHaveBeenCalledWith(tenantId, "a1", {
        blockedTopics: ["dosis", "descuento"],
        outOfScopeReply: guardrails.outOfScopeReply,
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

  it("never shows model jargon", () => {
    const { container } = render(
      <ToastProvider>
        <AgentGuardrailsPanel
          tenantId={tenantId}
          agentId="a1"
          guardrails={guardrails}
          businessHours={null}
          onSaved={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(container.textContent).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
