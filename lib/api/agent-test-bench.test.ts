import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteTestCase,
  formatSources,
  formatTestUsage,
  listTestCases,
  questionsOf,
  runAgentTest,
  saveTestCase,
  savedAnswers,
  validateTestCase,
  type AgentTestCase,
  type AgentTestResult,
  type AgentTestTurn,
} from "./agent-test-bench";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const result: AgentTestResult = {
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
  testedDraft: true,
};

describe("agent test bench api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("sends the message with the history so far", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const history = [{ role: "User" as const, content: "hola" }];
    await runAgentTest(tenantId, "a1", { message: "¿Hacen envíos?", history });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/test-chat`);
    expect(JSON.parse(init.body as string)).toEqual({ message: "¿Hacen envíos?", history });
  });

  it("summarizes what the answer cost", () => {
    expect(formatTestUsage(result.usage)).toBe("1.240 tokens · US$ 0,004 · 1,8 s");
  });

  it("names the documents behind the answer", () => {
    expect(formatSources(result)).toBe("Citó 1 fragmento de politicas-de-envio");
    expect(formatSources({ ...result, retrieved: [] })).toBeNull();
  });
});

const deliveries: AgentTestCase = {
  id: "tc1",
  name: "Domicilios a Belén",
  messages: [
    { role: "User", content: "¿hacen domicilios?" },
    { role: "Assistant", content: "Sí, en Laureles y Belén." },
    { role: "User", content: "¿cuánto cuesta?" },
  ],
  createdAt: "2026-09-16T14:57:54.271948+00:00",
};

describe("saved test cases api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  function stub(body: unknown, status = 200) {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("lists an assistant's cases as a bare array", async () => {
    const fetchMock = stub([deliveries]);

    await expect(listTestCases(tenantId, "a1")).resolves.toEqual([deliveries]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/test-cases`,
    );
  });

  it("saves the same turn shape test-chat receives", async () => {
    const fetchMock = stub(deliveries, 201);

    await saveTestCase(tenantId, "a1", { name: deliveries.name, messages: deliveries.messages });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Domicilios a Belén",
      messages: deliveries.messages,
    });
  });

  it("deletes one case by id", async () => {
    const fetchMock = stub(null, 204);

    await expect(deleteTestCase(tenantId, "a1", "tc1")).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/test-cases\/tc1$/);
    expect(init.method).toBe("DELETE");
  });
});

describe("validateTestCase", () => {
  const turns: AgentTestTurn[] = [{ role: "User", content: "hola" }];

  it("accepts a named case with at least one question", () => {
    expect(validateTestCase("Saludo", turns)).toBeNull();
  });

  it("asks for a name, because «hola» means nothing six weeks later", () => {
    expect(validateTestCase("   ", turns)).toBe(
      "Ponle un nombre al caso, para reconocerlo cuando lo vuelvas a probar.",
    );
  });

  it("refuses a name longer than the API allows", () => {
    expect(validateTestCase("x".repeat(81), turns)).toBe("El nombre puede tener hasta 80 caracteres.");
  });

  it("refuses an empty conversation", () => {
    expect(validateTestCase("Saludo", [])).toBe("Haz al menos una pregunta antes de guardar el caso.");
  });

  it("refuses more turns than the API allows", () => {
    const tooMany = Array.from({ length: 41 }, () => turns[0]);

    expect(validateTestCase("Larga", tooMany)).toMatch(/hasta 40 mensajes/);
  });
});

describe("replaying a case", () => {
  it("asks the saved questions again, in order", () => {
    expect(questionsOf(deliveries)).toEqual(["¿hacen domicilios?", "¿cuánto cuesta?"]);
  });

  it("pairs each question with the answer it had, and null when it never got one", () => {
    expect(savedAnswers(deliveries)).toEqual(["Sí, en Laureles y Belén.", null]);
  });
});
