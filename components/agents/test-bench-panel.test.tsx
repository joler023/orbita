import { ToastProvider } from "@/components/ui/toast";
import type { AgentTestCase, AgentTestResult } from "@/lib/api/agent-test-bench";
import { ApiError } from "@/lib/api/errors";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestBenchPanel } from "./test-bench-panel";

const { runAgentTest, listTestCases, saveTestCase, deleteTestCase } = vi.hoisted(() => ({
  runAgentTest: vi.fn(),
  listTestCases: vi.fn(),
  saveTestCase: vi.fn(),
  deleteTestCase: vi.fn(),
}));

vi.mock("@/lib/api/agent-test-bench", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/agent-test-bench")>("@/lib/api/agent-test-bench")),
  runAgentTest: (...args: unknown[]) => runAgentTest(...args),
  listTestCases: (...args: unknown[]) => listTestCases(...args),
  saveTestCase: (...args: unknown[]) => saveTestCase(...args),
  deleteTestCase: (...args: unknown[]) => deleteTestCase(...args),
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
    listTestCases.mockReset().mockResolvedValue([]);
    saveTestCase.mockReset();
    deleteTestCase.mockReset().mockResolvedValue(undefined);
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

  describe("saved test cases", () => {
    const deliveries: AgentTestCase = {
      id: "tc1",
      name: "Domicilios a Belén",
      messages: [
        { role: "User", content: "¿hacen domicilios?" },
        { role: "Assistant", content: "Sí, en Laureles y Belén." },
        { role: "User", content: "¿cuánto cuesta?" },
        { role: "Assistant", content: "Cuesta $5.000." },
      ],
      createdAt: "2026-09-16T14:57:54.271948+00:00",
    };

    it("explains what a saved case is for when there are none yet", async () => {
      renderPanel();

      expect(await screen.findByText(/guárdala como caso para repetirla/i)).toBeInTheDocument();
    });

    it("cannot save before there is a conversation to keep", () => {
      renderPanel();

      expect(screen.getByRole("button", { name: "Guardar como caso" })).toBeDisabled();
    });

    it("saves the conversation under the name the owner gives it", async () => {
      const user = userEvent.setup();
      saveTestCase.mockResolvedValue({ ...deliveries, id: "tc9", name: "Envíos" });
      renderPanel();

      await user.type(screen.getByLabelText("Pregunta de prueba"), "¿Hacen envíos?{Enter}");
      await screen.findByText("Sí, enviamos a Palmira.");
      await user.click(screen.getByRole("button", { name: "Guardar como caso" }));
      await user.type(screen.getByLabelText("¿Cómo lo llamas?"), "Envíos");
      await user.click(screen.getByRole("button", { name: "Guardar caso" }));

      await waitFor(() =>
        expect(saveTestCase).toHaveBeenCalledWith(tenantId, "a1", {
          name: "Envíos",
          messages: [
            { role: "User", content: "¿Hacen envíos?" },
            { role: "Assistant", content: "Sí, enviamos a Palmira." },
          ],
        }),
      );
      expect(await screen.findByText("Envíos")).toBeInTheDocument();
    });

    it("asks for a name instead of saving a case nobody will recognise", async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.type(screen.getByLabelText("Pregunta de prueba"), "hola{Enter}");
      await screen.findByText("Sí, enviamos a Palmira.");
      await user.click(screen.getByRole("button", { name: "Guardar como caso" }));
      await user.click(screen.getByRole("button", { name: "Guardar caso" }));

      expect(
        await screen.findByText("Ponle un nombre al caso, para reconocerlo cuando lo vuelvas a probar."),
      ).toBeInTheDocument();
      expect(saveTestCase).not.toHaveBeenCalled();
    });

    it("replays every saved question, threading the new answers as history", async () => {
      const user = userEvent.setup();
      listTestCases.mockResolvedValue([deliveries]);
      runAgentTest
        .mockResolvedValueOnce(result({ reply: "Sí, en Laureles y Belén." }))
        .mockResolvedValueOnce(result({ reply: "Cuesta $6.000." }));
      renderPanel();

      await user.click(await screen.findByRole("button", { name: "Probar de nuevo" }));

      await waitFor(() => expect(runAgentTest).toHaveBeenCalledTimes(2));
      expect(runAgentTest).toHaveBeenNthCalledWith(1, tenantId, "a1", {
        message: "¿hacen domicilios?",
        history: [],
      });
      expect(runAgentTest).toHaveBeenNthCalledWith(2, tenantId, "a1", {
        message: "¿cuánto cuesta?",
        history: [
          { role: "User", content: "¿hacen domicilios?" },
          { role: "Assistant", content: "Sí, en Laureles y Belén." },
        ],
      });
    });

    it("points out the answers that changed since the case was saved", async () => {
      const user = userEvent.setup();
      listTestCases.mockResolvedValue([deliveries]);
      runAgentTest
        .mockResolvedValueOnce(result({ reply: "Sí, en Laureles y Belén." }))
        .mockResolvedValueOnce(result({ reply: "Cuesta $6.000." }));
      renderPanel();

      await user.click(await screen.findByRole("button", { name: "Probar de nuevo" }));

      expect(await screen.findByText("Igual que cuando guardaste el caso.")).toBeInTheDocument();
      const changed = await screen.findByText(/Cambió\. Antes respondía:/);
      expect(changed.parentElement).toHaveTextContent("Cuesta $5.000.");
    });

    it("stops the replay and says why when a question fails", async () => {
      const user = userEvent.setup();
      listTestCases.mockResolvedValue([deliveries]);
      runAgentTest
        .mockResolvedValueOnce(result({ reply: "Sí, en Laureles y Belén." }))
        .mockRejectedValueOnce(new ApiError(502, "Model provider unavailable", "no"));
      renderPanel();

      await user.click(await screen.findByRole("button", { name: "Probar de nuevo" }));

      expect(
        await screen.findByText("El asistente no pudo responder ahora mismo. Inténtalo de nuevo en un momento."),
      ).toBeInTheDocument();
      expect(runAgentTest).toHaveBeenCalledTimes(2);
    });

    it("deletes a case", async () => {
      const user = userEvent.setup();
      listTestCases.mockResolvedValue([deliveries]);
      renderPanel();

      const list = await screen.findByRole("list", { name: "Casos guardados" });
      await user.click(within(list).getByRole("button", { name: "Eliminar el caso Domicilios a Belén" }));

      await waitFor(() => expect(deleteTestCase).toHaveBeenCalledWith(tenantId, "a1", "tc1"));
      expect(screen.queryByText("Domicilios a Belén")).not.toBeInTheDocument();
    });

    it("stops offering to save once the assistant has the maximum", async () => {
      const user = userEvent.setup();
      listTestCases.mockResolvedValue(
        Array.from({ length: 20 }, (_, index) => ({ ...deliveries, id: `tc${index}` })),
      );
      renderPanel();

      expect(await screen.findByText(/20 de 20/)).toBeInTheDocument();
      await user.type(screen.getByLabelText("Pregunta de prueba"), "hola{Enter}");
      await screen.findByText("Sí, enviamos a Palmira.");

      expect(screen.getByRole("button", { name: "Guardar como caso" })).toBeDisabled();
    });
  });
});
