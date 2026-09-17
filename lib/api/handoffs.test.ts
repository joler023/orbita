import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRefreshLock } from "./client";
import {
  describeHandoffReason,
  HANDOFF_REASONS,
  isWaitingForSummary,
  listHandoffs,
  returnToAssistant,
  type Handoff,
} from "./handoffs";

const tenantId = "11111111-1111-4111-8111-111111111111";

function handoff(overrides: Partial<Handoff> = {}): Handoff {
  return {
    conversationId: "c1",
    contactId: "k1",
    contactName: "Laura Gómez",
    reason: "CustomerAsked",
    requestedAt: "2026-09-16T22:06:50.409779+00:00",
    summary: "Pidió una devolución fuera de plazo.",
    lastMessageAt: "2026-09-16T22:06:51.188302+00:00",
    lastMessagePreview: "Listo: dejo de responderte yo.",
    ...overrides,
  };
}

function stubJson(body: unknown, status = 200) {
  // A fresh Response per call: a body can only be read once, so a shared one breaks the
  // second request with "Body has already been read" instead of testing anything.
  const fetchMock = vi
    .fn()
    .mockImplementation(async () =>
      new Response(status === 204 ? null : JSON.stringify(body), { status }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("handoffs api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("asks for the first page with the agreed size", async () => {
    const page = { items: [handoff()], nextCursor: null, total: 1 };
    const fetchMock = stubJson(page);

    await expect(listHandoffs(tenantId)).resolves.toEqual(page);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `http://localhost:5091/api/tenants/${tenantId}/handoffs?limit=25`,
    );
  });

  it("passes the cursor along and leaves it out when there is none", async () => {
    const fetchMock = stubJson({ items: [], nextCursor: null, total: 0 });

    await listHandoffs(tenantId, { cursor: "abc", limit: 2 });
    expect(fetchMock.mock.calls[0][0]).toContain("limit=2&cursor=abc");

    await listHandoffs(tenantId, { cursor: null });
    expect(fetchMock.mock.calls[1][0]).not.toContain("cursor");
  });

  it("returns a conversation to the assistant", async () => {
    const fetchMock = stubJson(null, 204);

    await expect(returnToAssistant(tenantId, "c1")).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `http://localhost:5091/api/tenants/${tenantId}/conversations/c1/return-to-assistant`,
    );
    expect(init.method).toBe("POST");
  });
});

describe("describeHandoffReason", () => {
  it("has copy for every reason the API can send", () => {
    for (const reason of HANDOFF_REASONS) {
      expect(describeHandoffReason(reason)).not.toBeNull();
    }
  });

  it("stays silent on a reason it does not know instead of inventing one", () => {
    expect(describeHandoffReason("SomethingNew")).toBeNull();
  });

  it("never blames the customer for being angry", () => {
    expect(describeHandoffReason("Frustration")).toBe("Se notó molesto o repitió lo mismo");
  });
});

describe("isWaitingForSummary", () => {
  it("is true while any summary is still being written", () => {
    expect(isWaitingForSummary({ items: [handoff(), handoff({ summary: null })] })).toBe(true);
  });

  it("is false once every conversation has one", () => {
    expect(isWaitingForSummary({ items: [handoff()] })).toBe(false);
    expect(isWaitingForSummary({ items: [] })).toBe(false);
  });
});
