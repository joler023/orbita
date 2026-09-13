import { ToastProvider } from "@/components/ui/toast";
import type { AiAgent, AiTool } from "@/lib/api/ai-agents";
import { ApiError } from "@/lib/api/errors";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentEditor } from "./agent-editor";

const { listAiTools, createAiAgent, updateAiAgent } = vi.hoisted(() => ({
  listAiTools: vi.fn(),
  createAiAgent: vi.fn(),
  updateAiAgent: vi.fn(),
}));

vi.mock("@/lib/api/ai-agents", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/ai-agents")>("@/lib/api/ai-agents")),
  listAiTools: (...args: unknown[]) => listAiTools(...args),
  createAiAgent: (...args: unknown[]) => createAiAgent(...args),
  updateAiAgent: (...args: unknown[]) => updateAiAgent(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

const agent: AiAgent = {
  id: "a1",
  name: "Aura",
  personality: "Cercana",
  instructions: "Nunca inventes precios.",
  tone: "Balanced",
  tools: [],
  isEnabled: false,
  conversationCount: 0,
  createdAt: "2026-09-11T12:00:00+00:00",
};

const tools: AiTool[] = [
  {
    key: "consultar_conocimiento",
    displayName: "Consultar los documentos del negocio",
    description: "Busca en lo que subiste.",
    isAvailable: true,
    unavailableReason: null,
  },
];

function renderEditor(props: Partial<Parameters<typeof AgentEditor>[0]> = {}) {
  const onSaved = vi.fn();
  const onDirtyChange = vi.fn();
  render(
    <ToastProvider>
      <AgentEditor
        tenantId={tenantId}
        agent={agent}
        onSaved={onSaved}
        onDirtyChange={onDirtyChange}
        {...props}
      />
    </ToastProvider>,
  );
  return { onSaved, onDirtyChange };
}

describe("AgentEditor", () => {
  beforeEach(() => {
    listAiTools.mockReset().mockResolvedValue(tools);
    createAiAgent.mockReset();
    updateAiAgent.mockReset();
  });

  it("saves instructions and tools together as the full set", async () => {
    const user = userEvent.setup();
    const updated = { ...agent, name: "Aura 2", tools: ["consultar_conocimiento"] };
    updateAiAgent.mockResolvedValue(updated);
    const { onSaved, onDirtyChange } = renderEditor();

    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    await user.type(screen.getByLabelText("¿Cómo se llama tu asistente?"), " 2");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("Tienes cambios sin guardar.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Herramientas" }));
    await user.click(await screen.findByRole("checkbox", { name: /Consultar los documentos/ }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(updateAiAgent).toHaveBeenCalledWith(tenantId, "a1", {
      name: "Aura 2",
      personality: "Cercana",
      instructions: "Nunca inventes precios.",
      tone: "Balanced",
      tools: ["consultar_conocimiento"],
    });
    expect(onSaved).toHaveBeenCalledWith(updated);
    expect(await screen.findByText("Guardamos los cambios.")).toBeInTheDocument();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("discards unsaved changes", async () => {
    const user = userEvent.setup();
    renderEditor();

    const name = screen.getByLabelText("¿Cómo se llama tu asistente?");
    await user.clear(name);
    await user.type(name, "Otra");
    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(name).toHaveValue("Aura");
  });

  it("validates before creating and goes back to the instructions", async () => {
    const user = userEvent.setup();
    renderEditor({ agent: null, onCancelCreate: vi.fn() });

    await user.click(screen.getByRole("tab", { name: "Herramientas" }));
    await user.click(screen.getByRole("button", { name: "Crear asistente" }));

    expect(createAiAgent).not.toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Instrucciones" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("¿Cómo se llama tu asistente?")).toHaveAccessibleDescription(
      "Ponle un nombre a tu asistente.",
    );
  });

  it("creates a new agent", async () => {
    const user = userEvent.setup();
    createAiAgent.mockResolvedValue(agent);
    const { onSaved } = renderEditor({ agent: null });

    await user.type(screen.getByLabelText("¿Cómo se llama tu asistente?"), "Aura");
    await user.type(screen.getByLabelText("¿Cómo habla?"), "Cercana");
    await user.type(screen.getByLabelText("¿Qué hace y qué nunca debe hacer?"), "Nunca inventes precios.");
    await user.click(screen.getByRole("button", { name: "Crear asistente" }));

    expect(createAiAgent).toHaveBeenCalledWith(tenantId, expect.objectContaining({ name: "Aura" }));
    expect(onSaved).toHaveBeenCalledWith(agent);
  });

  it("keeps the draft and explains the error when saving fails", async () => {
    const user = userEvent.setup();
    updateAiAgent.mockRejectedValue(new ApiError(403, "Forbidden", "no"));
    renderEditor();

    await user.type(screen.getByLabelText("¿Cómo habla?"), " y breve");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("No tienes permiso para esta acción.")).toBeInTheDocument();
    expect(screen.getByLabelText("¿Cómo habla?")).toHaveValue("Cercana y breve");
  });

  it("offers a retry when the tool catalog cannot load", async () => {
    const user = userEvent.setup();
    listAiTools.mockReset().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(tools);
    renderEditor();

    await user.click(screen.getByRole("tab", { name: "Herramientas" }));
    await user.click(await screen.findByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByRole("checkbox", { name: /Consultar los documentos/ })).toBeInTheDocument();
  });
});
