import { afterEach, describe, expect, it, vi } from "vitest";
import { formatSources, formatTestUsage, runAgentTest, type AgentTestResult } from "./agent-test-bench";
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
