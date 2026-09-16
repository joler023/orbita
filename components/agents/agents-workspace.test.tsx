import { ToastProvider } from "@/components/ui/toast";
import type { AiAgent } from "@/lib/api/ai-agents";
import { ApiError } from "@/lib/api/errors";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentsWorkspace } from "./agents-workspace";

const { listAiAgents, setAiAgentEnabled, deleteAiAgent, listAiTools, createAiAgent } = vi.hoisted(() => ({
  listAiAgents: vi.fn(),
  setAiAgentEnabled: vi.fn(),
  deleteAiAgent: vi.fn(),
  listAiTools: vi.fn(),
  createAiAgent: vi.fn(),
}));

vi.mock("@/lib/api/ai-agents", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/ai-agents")>("@/lib/api/ai-agents")),
  listAiAgents: (...args: unknown[]) => listAiAgents(...args),
  setAiAgentEnabled: (...args: unknown[]) => setAiAgentEnabled(...args),
  deleteAiAgent: (...args: unknown[]) => deleteAiAgent(...args),
  listAiTools: (...args: unknown[]) => listAiTools(...args),
  createAiAgent: (...args: unknown[]) => createAiAgent(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

function agent(overrides: Partial<AiAgent> = {}): AiAgent {
  return {
    id: "a1",
    name: "Aura",
    personality: "Cercana",
    instructions: "Nunca inventes precios.",
    style: { formality: "Balanced", verbosity: "Balanced", energy: "Balanced" },
    hasUnpublishedChanges: false,
    draft: null,
    tools: [],
    guardrails: { blockedTopics: [], outOfScopeReply: "Eso lo ve alguien del equipo.", handoffReply: "Listo: dejo de responderte yo y la conversación queda para alguien del equipo." },
    businessHours: null,
    isEnabled: true,
    conversationCount: 0,
    createdAt: "2026-09-11T12:00:00+00:00",
    ...overrides,
  };
}

function renderWorkspace() {
  return render(
    <ToastProvider>
      <AgentsWorkspace tenantId={tenantId} />
    </ToastProvider>,
  );
}

describe("AgentsWorkspace", () => {
  beforeEach(() => {
    listAiAgents.mockReset();
    setAiAgentEnabled.mockReset();
    deleteAiAgent.mockReset();
    listAiTools.mockReset().mockResolvedValue([]);
    createAiAgent.mockReset();
  });

  it("creates the first agent from the empty state and selects it", async () => {
    const user = userEvent.setup();
    listAiAgents.mockResolvedValue([]);
    createAiAgent.mockResolvedValue(agent({ isEnabled: false }));
    renderWorkspace();

    await user.click(await screen.findByRole("button", { name: "Crear mi primer asistente" }));
    await user.type(screen.getByLabelText("¿Cómo se llama tu asistente?"), "Aura");
    await user.type(screen.getByLabelText("¿Cómo habla?"), "Cercana");
    await user.type(screen.getByLabelText("¿Qué hace y qué nunca debe hacer?"), "Nunca inventes precios.");
    await user.click(screen.getByRole("button", { name: "Crear asistente" }));

    expect(await screen.findByRole("region", { name: "Configuración de Aura" })).toBeInTheDocument();
    expect(screen.getByText("1 asistente · 0 activos")).toBeInTheDocument();
  });

  it("asks before leaving an agent with unsaved changes", async () => {
    const user = userEvent.setup();
    listAiAgents.mockResolvedValue([agent(), agent({ id: "a2", name: "Nova" })]);
    renderWorkspace();

    await user.type(await screen.findByLabelText("¿Cómo habla?"), " y breve");
    await user.click(screen.getByRole("button", { name: /Nova/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Tienes cambios sin guardar");
    expect(screen.getByRole("region", { name: "Configuración de Aura" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Descartar y seguir" }));
    expect(screen.getByRole("region", { name: "Configuración de Nova" })).toBeInTheDocument();
  });

  it("lists the agents and opens the first one", async () => {
    listAiAgents.mockResolvedValue([agent(), agent({ id: "a2", name: "Nova", isEnabled: false })]);
    renderWorkspace();

    expect(await screen.findByText("2 asistentes · 1 activo")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Configuración de Aura" })).toBeInTheDocument();
    expect(listAiAgents).toHaveBeenCalledWith(tenantId);
  });

  it("switches the detail when another agent is selected", async () => {
    const user = userEvent.setup();
    listAiAgents.mockResolvedValue([agent(), agent({ id: "a2", name: "Nova" })]);
    renderWorkspace();

    await user.click(await screen.findByRole("button", { name: /Nova/ }));

    expect(screen.getByRole("region", { name: "Configuración de Nova" })).toBeInTheDocument();
  });

  it("explains who can grant access when the role is not allowed", async () => {
    listAiAgents.mockRejectedValue(new ApiError(403, "Forbidden", "no"));
    renderWorkspace();

    expect(await screen.findByText("Necesitas permiso de administrador")).toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    const user = userEvent.setup();
    listAiAgents.mockRejectedValueOnce(new ApiError(500, "Unexpected error", "boom")).mockResolvedValue([agent()]);
    renderWorkspace();

    await user.click(await screen.findByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByRole("region", { name: "Configuración de Aura" })).toBeInTheDocument();
  });

  it("sells the feature when there are no agents", async () => {
    listAiAgents.mockResolvedValue([]);
    renderWorkspace();

    expect(await screen.findByText("Tu asistente atiende mientras tu equipo descansa")).toBeInTheDocument();
  });

  it("pauses an agent and rolls back if the server refuses", async () => {
    const user = userEvent.setup();
    listAiAgents.mockResolvedValue([agent()]);
    setAiAgentEnabled.mockRejectedValue(new ApiError(403, "Forbidden", "no"));
    renderWorkspace();

    const region = await screen.findByRole("region", { name: "Configuración de Aura" });
    await user.click(within(region).getByRole("switch"));

    expect(setAiAgentEnabled).toHaveBeenCalledWith(tenantId, "a1", false);
    expect(await screen.findByText("No tienes permiso para esta acción.")).toBeInTheDocument();
    expect(within(region).getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("confirms before deleting and shows why the last agent cannot go", async () => {
    const user = userEvent.setup();
    listAiAgents.mockResolvedValue([agent()]);
    deleteAiAgent.mockRejectedValue(new ApiError(409, "Cannot delete last agent", "no"));
    renderWorkspace();

    await user.click(await screen.findByRole("button", { name: "Eliminar" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("No se puede deshacer");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar asistente" }));

    expect(deleteAiAgent).toHaveBeenCalledWith(tenantId, "a1");
    expect(
      await screen.findByText("No puedes eliminar tu único asistente. Pausa el asistente si no quieres que responda."),
    ).toBeInTheDocument();
  });
});
