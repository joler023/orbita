import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAiAgent,
  deleteAiAgent,
  listAiAgents,
  listAiTools,
  setAiAgentEnabled,
  toSaveRequest,
  saveAiAgentDraft,
  publishAiAgent,
  discardAiAgentDraft,
  saveAgentGuardrails,
  validateGuardrails,
  BLOCKED_TOPICS_MAX,
  BLOCKED_TOPIC_MAX_LENGTH,
  OUT_OF_SCOPE_REPLY_MAX_LENGTH,
  type AiAgent,
} from "./ai-agents";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const agent: AiAgent = {
  id: "a1",
  name: "Aura",
  personality: "Cercana",
  instructions: "Nunca inventes precios.",
  style: { formality: "Balanced", verbosity: "Balanced", energy: "Balanced" },
  hasUnpublishedChanges: false,
  draft: null,
  tools: ["consultar_conocimiento"],
  guardrails: { blockedTopics: [], outOfScopeReply: "Eso lo ve alguien del equipo." },
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
      style: { formality: "Balanced", verbosity: "Balanced", energy: "Balanced" },
      tools: ["consultar_conocimiento"],
    });

    const saveMock = stubJson(agent);
    await saveAiAgentDraft(tenantId, "a1", toSaveRequest(agent));
    expect(lastCall(saveMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1`);
    expect(lastCall(saveMock)[1].method).toBe("PATCH");
  });

  it("publishes and discards the draft through their own routes", async () => {
    const publishMock = stubJson({ ...agent, hasUnpublishedChanges: false });
    await publishAiAgent(tenantId, "a1");
    expect(lastCall(publishMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/publish`);
    expect(lastCall(publishMock)[1].method).toBe("POST");

    const discardMock = stubJson(agent);
    await discardAiAgentDraft(tenantId, "a1");
    expect(lastCall(discardMock)[0]).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/draft`);
    expect(lastCall(discardMock)[1].method).toBe("DELETE");
  });

  it("binds the form to the draft when the agent has unpublished changes", () => {
    const withDraft: AiAgent = {
      ...agent,
      hasUnpublishedChanges: true,
      draft: {
        name: "Aura nueva",
        personality: "Más cercana",
        instructions: "Nunca inventes precios.",
        style: { formality: "Warm", verbosity: "Brief", energy: "Enthusiastic" },
        tools: [],
        updatedAt: "2026-09-14T10:00:00+00:00",
      },
    };

    expect(toSaveRequest(withDraft)).toEqual({
      name: "Aura nueva",
      personality: "Más cercana",
      instructions: "Nunca inventes precios.",
      style: { formality: "Warm", verbosity: "Brief", energy: "Enthusiastic" },
      tools: [],
    });
    expect(toSaveRequest(agent).name).toBe("Aura");
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

  it("saves guardrails on their own subresource, not through the draft", async () => {
    const guardrails = { blockedTopics: ["dosis"], outOfScopeReply: "Te responde el equipo." };
    const fetchMock = stubJson({ ...agent, guardrails });

    await saveAgentGuardrails(tenantId, "a1", guardrails);

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/guardrails`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual(guardrails);
  });
});

describe("validateGuardrails", () => {
  const reply = "Eso lo ve alguien del equipo.";

  it("accepts what the API accepts", () => {
    expect(validateGuardrails({ blockedTopics: ["dosis"], outOfScopeReply: reply })).toBeNull();
    expect(validateGuardrails({ blockedTopics: [], outOfScopeReply: reply })).toBeNull();
  });

  it("rejects more topics than the API allows", () => {
    const blockedTopics = Array.from({ length: BLOCKED_TOPICS_MAX + 1 }, (_, i) => `tema ${i}`);

    expect(validateGuardrails({ blockedTopics, outOfScopeReply: reply })).toBe(
      "Puedes indicar hasta 50 temas.",
    );
  });

  it("rejects a topic longer than the API allows", () => {
    const blockedTopics = ["x".repeat(BLOCKED_TOPIC_MAX_LENGTH + 1)];

    expect(validateGuardrails({ blockedTopics, outOfScopeReply: reply })).toBe(
      "Cada tema puede tener hasta 120 caracteres.",
    );
  });

  it("requires a reply, because a blocked topic always answers something", () => {
    expect(validateGuardrails({ blockedTopics: ["dosis"], outOfScopeReply: "   " })).toBe(
      "Escribe qué responde tu asistente cuando no puede hablar de un tema.",
    );
  });

  it("rejects a reply longer than the API allows", () => {
    const outOfScopeReply = "x".repeat(OUT_OF_SCOPE_REPLY_MAX_LENGTH + 1);

    expect(validateGuardrails({ blockedTopics: [], outOfScopeReply })).toBe(
      "La respuesta puede tener hasta 500 caracteres.",
    );
  });
});
