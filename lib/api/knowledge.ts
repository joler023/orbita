import { apiRequest } from "./client";

export const KNOWLEDGE_ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"] as const;
export const KNOWLEDGE_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const KNOWLEDGE_TEXT_TITLE_MAX_LENGTH = 300;
export const KNOWLEDGE_TEXT_MAX_LENGTH = 500_000;
export const KNOWLEDGE_POLL_INTERVAL_MS = 3_000;

const UPLOAD_TIMEOUT_MS = 120_000;
const SEARCH_TIMEOUT_MS = 15_000;

export type KnowledgeDocStatus = "Pending" | "Processing" | "Indexed" | "Failed";

export type KnowledgeDocSourceType = "Upload" | "Manual" | "Url";

export type KnowledgeDocument = {
  id: string;
  agentId: string;
  title: string;
  sourceType: KnowledgeDocSourceType;
  status: KnowledgeDocStatus;
  chunkCount: number;
  failureReason: string | null;
  indexedAt: string | null;
  createdAt: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type KnowledgeSearchHit = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
};

function knowledgePath(tenantId: string, agentId: string): string {
  return `/api/tenants/${tenantId}/ai-agents/${agentId}/knowledge`;
}

export function listKnowledgeDocuments(
  tenantId: string,
  agentId: string,
  page: { cursor?: string; limit?: number } = {},
): Promise<CursorPage<KnowledgeDocument>> {
  const params = new URLSearchParams();
  if (page.cursor) {
    params.set("cursor", page.cursor);
  }
  if (page.limit) {
    params.set("limit", String(page.limit));
  }
  const query = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<CursorPage<KnowledgeDocument>>(`${knowledgePath(tenantId, agentId)}${query}`);
}

export function uploadKnowledgeDocument(
  tenantId: string,
  agentId: string,
  file: File,
): Promise<KnowledgeDocument> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<KnowledgeDocument>(
    knowledgePath(tenantId, agentId),
    { method: "POST", body },
    { timeoutMs: UPLOAD_TIMEOUT_MS },
  );
}

export function addKnowledgeText(
  tenantId: string,
  agentId: string,
  body: { title: string; text: string },
): Promise<KnowledgeDocument> {
  return apiRequest<KnowledgeDocument>(`${knowledgePath(tenantId, agentId)}/text`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function reindexKnowledgeDocument(
  tenantId: string,
  agentId: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return apiRequest<KnowledgeDocument>(`${knowledgePath(tenantId, agentId)}/${documentId}/reindex`, {
    method: "POST",
  });
}

export function deleteKnowledgeDocument(
  tenantId: string,
  agentId: string,
  documentId: string,
): Promise<void> {
  return apiRequest<void>(`${knowledgePath(tenantId, agentId)}/${documentId}`, { method: "DELETE" });
}

export function searchKnowledge(
  tenantId: string,
  agentId: string,
  body: { query: string; limit?: number },
): Promise<KnowledgeSearchHit[]> {
  return apiRequest<KnowledgeSearchHit[]>(
    `${knowledgePath(tenantId, agentId)}/search`,
    { method: "POST", body: JSON.stringify(body) },
    { timeoutMs: SEARCH_TIMEOUT_MS },
  );
}

export function isIndexingInProgress(documents: ReadonlyArray<KnowledgeDocument>): boolean {
  return documents.some((document) => document.status === "Pending" || document.status === "Processing");
}
