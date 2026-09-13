import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAiAgent,
  deleteAiAgent,
  listAiAgents,
  listAiTools,
  setAiAgentEnabled,
  toSaveRequest,
  updateAiAgent,
  type AiAgent,
} from "./ai-agents";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const agent: AiAgent = {
  id: "a1",
  name: "Aura",
  personality: "Cercana",
  instructions: "Nunca inventes precios.",
  tone: "Balanced",
  tools: ["consultar_conocimiento"],
  isEnabled: true,
  conversationCount: 0,
  createdAt: "2026-09-11T12:00:00+00:00",
};

function stubJson(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(status === 204 ? null : JSON.stringify(body), { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

describe("ai agents api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("lists the tenant's agents", async () => {
    const fetchMock = stubJson([agent]);

    await expect(listAiAgents(tenantId)).resolves.toEqual([agent]);
    expect(lastCall(fetchMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents`);
  });

  it("creates and updates with the full tool set", async () => {
    const fetchMock = stubJson(agent, 201);

    await createAiAgent(tenantId, toSaveRequest(agent));
    const [, init] = lastCall(fetchMock);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Aura",
      personality: "Cercana",
      instructions: "Nunca inventes precios.",
      tone: "Balanced",
      tools: ["consultar_conocimiento"],
    });

    const updateMock = stubJson(agent);
    await updateAiAgent(tenantId, "a1", toSaveRequest(agent));
    expect(lastCall(updateMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1`);
    expect(lastCall(updateMock)[1].method).toBe("PATCH");
  });

  it("toggles through the enabled subresource", async () => {
    const fetchMock = stubJson({ ...agent, isEnabled: false });

    const result = await setAiAgentEnabled(tenantId, "a1", false);

    expect(result.isEnabled).toBe(false);
    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/enabled`);
    expect(JSON.parse(init.body as string)).toEqual({ isEnabled: false });
  });

  it("deletes an agent", async () => {
    const fetchMock = stubJson(null, 204);

    await expect(deleteAiAgent(tenantId, "a1")).resolves.toBeUndefined();
    expect(lastCall(fetchMock)[1].method).toBe("DELETE");
  });

  it("reads the product-wide tool catalog", async () => {
    const fetchMock = stubJson([]);

    await listAiTools();

    expect(lastCall(fetchMock)[0]).toBe("http://localhost:5091/api/ai-tools");
  });
});
