import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRefreshLock } from "./client";
import {
  addKnowledgeText,
  deleteKnowledgeDocument,
  isIndexingInProgress,
  listKnowledgeDocuments,
  reindexKnowledgeDocument,
  searchKnowledge,
  uploadKnowledgeDocument,
  type KnowledgeDocument,
} from "./knowledge";

const tenantId = "11111111-1111-4111-8111-111111111111";
const base = `http://localhost:5091/api/tenants/${tenantId}/ai-agents/a1/knowledge`;

const document: KnowledgeDocument = {
  id: "d1",
  agentId: "a1",
  title: "catalogo.pdf",
  sourceType: "Upload",
  status: "Pending",
  chunkCount: 0,
  failureReason: null,
  indexedAt: null,
  createdAt: "2026-09-11T12:00:00+00:00",
};

function stub(body: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function call(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

describe("knowledge api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("lists a page and forwards the opaque cursor", async () => {
    const fetchMock = stub({ items: [document], nextCursor: null });

    const page = await listKnowledgeDocuments(tenantId, "a1", { cursor: "1757246400000", limit: 50 });

    expect(page.items).toEqual([document]);
    expect(call(fetchMock)[0]).toBe(`${base}?cursor=1757246400000&limit=50`);
  });

  it("uploads the file as multipart and returns the accepted document", async () => {
    const fetchMock = stub(document, 202);
    const file = new File(["hola"], "catalogo.pdf");

    const result = await uploadKnowledgeDocument(tenantId, "a1", file);

    expect(result.status).toBe("Pending");
    const [url, init] = call(fetchMock);
    expect(url).toBe(base);
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("adds pasted text", async () => {
    const fetchMock = stub({ ...document, sourceType: "Manual" }, 202);

    await addKnowledgeText(tenantId, "a1", { title: "Horarios", text: "Abrimos a las 7" });

    const [url, init] = call(fetchMock);
    expect(url).toBe(`${base}/text`);
    expect(JSON.parse(init.body as string)).toEqual({ title: "Horarios", text: "Abrimos a las 7" });
  });

  it("reindexes and deletes a document", async () => {
    const reindexMock = stub(document, 202);
    await reindexKnowledgeDocument(tenantId, "a1", "d1");
    expect(call(reindexMock)).toEqual([`${base}/d1/reindex`, expect.objectContaining({ method: "POST" })]);

    const deleteMock = stub(null, 204);
    await deleteKnowledgeDocument(tenantId, "a1", "d1");
    expect(call(deleteMock)).toEqual([`${base}/d1`, expect.objectContaining({ method: "DELETE" })]);
  });

  it("searches with the question in the body, not the url", async () => {
    const fetchMock = stub([]);

    await searchKnowledge(tenantId, "a1", { query: "¿a qué hora abren?", limit: 5 });

    const [url, init] = call(fetchMock);
    expect(url).toBe(`${base}/search`);
    expect(JSON.parse(init.body as string)).toEqual({ query: "¿a qué hora abren?", limit: 5 });
  });

  it("knows when indexing is still running", () => {
    expect(isIndexingInProgress([document])).toBe(true);
    expect(isIndexingInProgress([{ ...document, status: "Processing" }])).toBe(true);
    expect(isIndexingInProgress([{ ...document, status: "Indexed" }, { ...document, status: "Failed" }])).toBe(
      false,
    );
  });
});
