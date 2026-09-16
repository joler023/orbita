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

export const TEST_CASES_MAX = 20;
export const TEST_CASE_NAME_MAX_LENGTH = 80;
export const TEST_CASE_TURNS_MAX = 40;

/**
 * A conversation the owner kept to run again after changing the assistant. It stores the same
 * turns `test-chat` receives, so a saved case and a live history are one shape, not two.
 */
export type AgentTestCase = {
  id: string;
  name: string;
  messages: AgentTestTurn[];
  createdAt: string;
};

function testCasesPath(tenantId: string, agentId: string): string {
  return `/api/tenants/${tenantId}/ai-agents/${agentId}/test-cases`;
}

export function listTestCases(tenantId: string, agentId: string): Promise<AgentTestCase[]> {
  return apiRequest<AgentTestCase[]>(testCasesPath(tenantId, agentId));
}

export function saveTestCase(
  tenantId: string,
  agentId: string,
  body: { name: string; messages: AgentTestTurn[] },
): Promise<AgentTestCase> {
  return apiRequest<AgentTestCase>(testCasesPath(tenantId, agentId), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** 204 even when it was already gone: the owner wanted it not to exist, and it does not. */
export function deleteTestCase(tenantId: string, agentId: string, caseId: string): Promise<void> {
  return apiRequest<void>(`${testCasesPath(tenantId, agentId)}/${caseId}`, { method: "DELETE" });
}

/** Mirrors the API's limits. Returns the reason in Spanish, or null when the case can be saved. */
export function validateTestCase(name: string, messages: ReadonlyArray<AgentTestTurn>): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "Ponle un nombre al caso, para reconocerlo cuando lo vuelvas a probar.";
  }
  if (trimmed.length > TEST_CASE_NAME_MAX_LENGTH) {
    return `El nombre puede tener hasta ${TEST_CASE_NAME_MAX_LENGTH} caracteres.`;
  }
  if (messages.length === 0) {
    return "Haz al menos una pregunta antes de guardar el caso.";
  }
  if (messages.length > TEST_CASE_TURNS_MAX) {
    return `Un caso puede guardar hasta ${TEST_CASE_TURNS_MAX} mensajes. Reinicia y prueba una conversación más corta.`;
  }
  return null;
}

/** Re-running a case asks the questions again; the old answers are only kept to compare. */
export function questionsOf(testCase: AgentTestCase): string[] {
  return testCase.messages.filter((turn) => turn.role === "User").map((turn) => turn.content);
}

/** What the assistant answered the n-th question when the case was saved, if it answered. */
export function savedAnswers(testCase: AgentTestCase): Array<string | null> {
  const answers: Array<string | null> = [];
  testCase.messages.forEach((turn, index) => {
    if (turn.role === "User") {
      const next = testCase.messages[index + 1];
      answers.push(next?.role === "Assistant" ? next.content : null);
    }
  });
  return answers;
}
