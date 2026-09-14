import { ToastProvider } from "@/components/ui/toast";
import type { AgentTestResult } from "@/lib/api/agent-test-bench";
import { ApiError } from "@/lib/api/errors";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestBenchPanel } from "./test-bench-panel";

const { runAgentTest } = vi.hoisted(() => ({ runAgentTest: vi.fn() }));

vi.mock("@/lib/api/agent-test-bench", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/agent-test-bench")>("@/lib/api/agent-test-bench")),
  runAgentTest: (...args: unknown[]) => runAgentTest(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

function result(overrides: Partial<AgentTestResult> = {}): AgentTestResult {
  return {
    reply: "Sí, enviamos a Palmira.",
    retrieved: [
      {
        chunkId: "c1",
        documentId: "d1",
        documentTitle: "politicas-de-envio",
        chunkIndex: 0,
        content: "Envío gratis por compras superiores a $150.000.",
        score: 0.87,
      },
    ],
    toolCalls: [{ tool: "consultar_conocimiento", summary: "Buscó en los documentos del negocio." }],
    usage: { tokensIn: 1000, tokensOut: 240, costUsd: 0.004, latencyMs: 1800 },
    testedDraft: false,
    ...overrides,
  };
}

function renderPanel() {
  render(
    <ToastProvider>
      <TestBenchPanel tenantId={tenantId} agentId="a1" />
    </ToastProvider>,
  );
}

describe("TestBenchPanel", () => {
  beforeEach(() => {
    runAgentTest.mockReset().mockResolvedValue(result());
  });

  it("makes it obvious nobody receives these messages", () => {
    renderPanel();

    expect(screen.getByText("Escríbele como lo haría un cliente. Nadie recibe estos mensajes.")).toBeInTheDocument();
  });

  it("shows the answer with the tools, the sources and what it cost", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("Pregunta de prueba"), "¿Hacen envíos a Palmira?");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(runAgentTest).toHaveBeenCalledWith(tenantId, "a1", {
      message: "¿Hacen envíos a Palmira?",
      history: [],
    });
    expect(await screen.findByText("Sí, enviamos a Palmira.")).toBeInTheDocument();
    expect(screen.getByText("Buscó en los documentos del negocio.")).toBeInTheDocument();
    expect(screen.getByText("Citó 1 fragmento de politicas-de-envio")).toBeInTheDocument();
    expect(screen.getByText("1.240 tokens · US$ 0,004 · 1,8 s")).toBeInTheDocument();
  });

  it("says when the answer came from unpublished changes", async () => {
    const user = userEvent.setup();
    runAgentTest.mockResolvedValue(result({ testedDraft: true }));
    renderPanel();

    await user.click(screen.getByRole("button", { name: "¿Hacen envíos?" }));

    expect(await screen.findByText("Versión sin publicar")).toBeInTheDocument();
  });

  it("carries the exchange so far as history and can start over", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: "¿Cuánto cuesta?" }));
    await screen.findByText("Sí, enviamos a Palmira.");
    await user.click(screen.getByRole("button", { name: "¿Hacen envíos?" }));

    expect(runAgentTest).toHaveBeenLastCalledWith(tenantId, "a1", {
      message: "¿Hacen envíos?",
      history: [
        { role: "User", content: "¿Cuánto cuesta?" },
        { role: "Assistant", content: "Sí, enviamos a Palmira." },
      ],
    });

    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    expect(
      screen.getByText("Haz una pregunta para ver qué respondería y de dónde sacó la respuesta."),
    ).toBeInTheDocument();
  });

  it("keeps the question when the model provider is down", async () => {
    const user = userEvent.setup();
    runAgentTest.mockRejectedValue(new ApiError(502, "Model provider unavailable", "no"));
    renderPanel();

    const field = screen.getByLabelText("Pregunta de prueba");
    await user.type(field, "¿Tienen envío?");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await screen.findByText("El asistente no pudo responder ahora mismo. Inténtalo de nuevo en un momento."),
    ).toBeInTheDocument();
    expect(field).toHaveValue("¿Tienen envío?");
  });
});
