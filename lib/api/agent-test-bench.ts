import { apiRequest } from "./client";
import type { KnowledgeSearchHit } from "./knowledge";

export const TEST_MESSAGE_MAX_LENGTH = 2_000;

/** A model call plus a knowledge lookup takes far longer than a plain CRUD request. */
const TEST_CHAT_TIMEOUT_MS = 60_000;

export type AgentTestRole = "User" | "Assistant";

export type AgentTestTurn = {
  role: AgentTestRole;
  content: string;
};

export type AgentToolCallTrace = {
  tool: string;
  summary: string;
};

export type AgentTestUsage = {
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
};

export type AgentTestResult = {
  reply: string;
  retrieved: KnowledgeSearchHit[];
  toolCalls: AgentToolCallTrace[];
  usage: AgentTestUsage;
  testedDraft: boolean;
};

export function runAgentTest(
  tenantId: string,
  agentId: string,
  body: { message: string; history: AgentTestTurn[] },
): Promise<AgentTestResult> {
  return apiRequest<AgentTestResult>(
    `/api/tenants/${tenantId}/ai-agents/${agentId}/test-chat`,
    { method: "POST", body: JSON.stringify(body) },
    { timeoutMs: TEST_CHAT_TIMEOUT_MS },
  );
}

export function formatTestUsage(usage: AgentTestUsage): string {
  const tokens = new Intl.NumberFormat("es-CO").format(usage.tokensIn + usage.tokensOut);
  const cost = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 3, maximumFractionDigits: 4 }).format(
    usage.costUsd,
  );
  const seconds = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(usage.latencyMs / 1000);
  return `${tokens} tokens · US$ ${cost} · ${seconds} s`;
}

export function formatSources(result: AgentTestResult): string | null {
  const titles = [...new Set(result.retrieved.map((hit) => hit.documentTitle))];
  if (titles.length === 0) {
    return null;
  }
  const fragments = result.retrieved.length === 1 ? "1 fragmento" : `${result.retrieved.length} fragmentos`;
  return `Citó ${fragments} de ${titles.join(", ")}`;
}
