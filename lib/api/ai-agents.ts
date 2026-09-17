import { apiRequest } from "./client";

export const FORMALITY_LEVELS = ["Formal", "Balanced", "Warm"] as const;
export const VERBOSITY_LEVELS = ["Brief", "Balanced", "Detailed"] as const;
export const ENERGY_LEVELS = ["Neutral", "Balanced", "Enthusiastic"] as const;

export type FormalityLevel = (typeof FORMALITY_LEVELS)[number];
export type VerbosityLevel = (typeof VERBOSITY_LEVELS)[number];
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export type AgentStyle = {
  formality: FormalityLevel;
  verbosity: VerbosityLevel;
  energy: EnergyLevel;
};

export const DEFAULT_AGENT_STYLE: AgentStyle = {
  formality: "Balanced",
  verbosity: "Balanced",
  energy: "Balanced",
};

export const AGENT_NAME_MAX_LENGTH = 120;
export const AGENT_PERSONALITY_MAX_LENGTH = 2_000;
export const AGENT_INSTRUCTIONS_MAX_LENGTH = 8_000;
export const BLOCKED_TOPICS_MAX = 50;
export const BLOCKED_TOPIC_MAX_LENGTH = 120;
export const OUT_OF_SCOPE_REPLY_MAX_LENGTH = 500;
export const HANDOFF_REPLY_MAX_LENGTH = 500;

/**
 * What the assistant refuses to talk about, and what it answers instead. Unlike the rest of
 * the form this is not a draft: it applies the moment it is saved, because a topic the owner
 * wants off the table cannot wait for a publish.
 */
export type AgentGuardrails = {
  blockedTopics: string[];
  outOfScopeReply: string;
  /** What the customer reads when the conversation leaves the assistant for the team. */
  handoffReply: string;
};

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export const BUSINESS_HOURS_SLOTS_MAX = 21;

/** One stretch of a single day, in the organization's own time zone. Never crosses midnight. */
export type BusinessHoursSlot = {
  day: WeekDay;
  /** "HH:mm:ss" local time. */
  opens: string;
  closes: string;
};

export type OutsideHours = "AssistantAnswers" | "LeaveForTeam";

/**
 * When the business is open, and what the assistant does the rest of the time. A null
 * schedule means the assistant is on duty around the clock, which is the default.
 */
export type BusinessHours = {
  slots: BusinessHoursSlot[];
  outsideHours: OutsideHours;
};

export type AiAgentDraft = {
  name: string;
  personality: string;
  instructions: string;
  style: AgentStyle;
  tools: string[];
  updatedAt: string;
};

export type AiAgent = {
  id: string;
  name: string;
  personality: string;
  instructions: string;
  style: AgentStyle;
  tools: string[];
  guardrails: AgentGuardrails;
  businessHours: BusinessHours | null;
  isEnabled: boolean;
  hasUnpublishedChanges: boolean;
  draft: AiAgentDraft | null;
  conversationCount: number;
  createdAt: string;
};

export type SaveAiAgentRequest = {
  name: string;
  personality: string;
  instructions: string;
  style: AgentStyle;
  tools: string[];
};

export type AiTool = {
  key: string;
  displayName: string;
  description: string;
  isAvailable: boolean;
  unavailableReason: string | null;
  /**
   * Which module the result lands in ("pipeline"), or null when the tool leaves nothing to
   * look at. Open on purpose: the API names the destination and the dashboard decides what
   * to say about it, so a new module needs no frontend release.
   */
  resultsIn: string | null;
};

function agentsPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/ai-agents`;
}

export function listAiAgents(tenantId: string): Promise<AiAgent[]> {
  return apiRequest<AiAgent[]>(agentsPath(tenantId));
}

export function getAiAgent(tenantId: string, agentId: string): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}`);
}

export function createAiAgent(tenantId: string, body: SaveAiAgentRequest): Promise<AiAgent> {
  return apiRequest<AiAgent>(agentsPath(tenantId), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Saves as an unpublished draft: the live assistant keeps answering with what it had. */
export function saveAiAgentDraft(
  tenantId: string,
  agentId: string,
  body: SaveAiAgentRequest,
): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function publishAiAgent(tenantId: string, agentId: string): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}/publish`, { method: "POST" });
}

export function discardAiAgentDraft(tenantId: string, agentId: string): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}/draft`, { method: "DELETE" });
}

export function setAiAgentEnabled(
  tenantId: string,
  agentId: string,
  isEnabled: boolean,
): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ isEnabled }),
  });
}

/** Applies immediately, like the on/off switch — it never waits for a publish. */
export function saveAgentGuardrails(
  tenantId: string,
  agentId: string,
  body: AgentGuardrails,
): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}/guardrails`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Applies immediately too. Null puts the assistant on duty at all hours; a schedule with no
 * slots is refused by the API, because it would silence the assistant for good.
 */
export function saveBusinessHours(
  tenantId: string,
  agentId: string,
  businessHours: BusinessHours | null,
): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}/business-hours`, {
    method: "PUT",
    body: JSON.stringify({ businessHours }),
  });
}

/**
 * Mirrors what the API enforces, so the owner is told before the request leaves rather than
 * by a 400. Returns the reason in Spanish, or null when there is nothing to fix.
 */
export function validateGuardrails(guardrails: AgentGuardrails): string | null {
  if (guardrails.blockedTopics.length > BLOCKED_TOPICS_MAX) {
    return `Puedes indicar hasta ${BLOCKED_TOPICS_MAX} temas.`;
  }
  if (guardrails.blockedTopics.some((topic) => topic.length > BLOCKED_TOPIC_MAX_LENGTH)) {
    return `Cada tema puede tener hasta ${BLOCKED_TOPIC_MAX_LENGTH} caracteres.`;
  }
  if (guardrails.outOfScopeReply.trim().length === 0) {
    return "Escribe qué responde tu asistente cuando no puede hablar de un tema.";
  }
  if (guardrails.outOfScopeReply.length > OUT_OF_SCOPE_REPLY_MAX_LENGTH) {
    return `La respuesta puede tener hasta ${OUT_OF_SCOPE_REPLY_MAX_LENGTH} caracteres.`;
  }
  if (guardrails.handoffReply.trim().length === 0) {
    return "Escribe qué le responde tu asistente cuando la conversación pasa a tu equipo.";
  }
  if (guardrails.handoffReply.length > HANDOFF_REPLY_MAX_LENGTH) {
    return `La frase para pasar la conversación puede tener hasta ${HANDOFF_REPLY_MAX_LENGTH} caracteres.`;
  }
  return null;
}

export function deleteAiAgent(tenantId: string, agentId: string): Promise<void> {
  return apiRequest<void>(`${agentsPath(tenantId)}/${agentId}`, { method: "DELETE" });
}

export function listAiTools(): Promise<AiTool[]> {
  return apiRequest<AiTool[]>("/api/ai-tools");
}

/** What the form binds to: the owner's unpublished edits when there are any, else what is live. */
export function toSaveRequest(agent: AiAgent): SaveAiAgentRequest {
  const source = agent.draft ?? agent;
  return {
    name: source.name,
    personality: source.personality,
    instructions: source.instructions,
    style: source.style,
    tools: source.tools,
  };
}

export const SEMANTIC_CACHE_LEVELS = ["Off", "Conservative", "Balanced", "Aggressive"] as const;

export type SemanticCacheLevel = (typeof SEMANTIC_CACHE_LEVELS)[number];

/**
 * Reusing the previous answer when two customers ask almost the same thing (ORB-C12).
 *
 * `hitRate` is null while nobody has asked yet — which is not the same as 0%, and the
 * screen must not read it as "never works". It is a share between 0 and 1.
 */
export type SemanticCache = {
  level: SemanticCacheLevel;
  hits: number;
  misses: number;
  hitRate: number | null;
};

function semanticCachePath(tenantId: string, agentId: string): string {
  return `${agentsPath(tenantId)}/${agentId}/semantic-cache`;
}

export function getSemanticCache(tenantId: string, agentId: string): Promise<SemanticCache> {
  return apiRequest<SemanticCache>(semanticCachePath(tenantId, agentId));
}

/** Applies immediately, like the rest of what limits how the assistant works. */
export function setSemanticCacheLevel(
  tenantId: string,
  agentId: string,
  level: SemanticCacheLevel,
): Promise<SemanticCache> {
  return apiRequest<SemanticCache>(semanticCachePath(tenantId, agentId), {
    method: "PUT",
    body: JSON.stringify({ level }),
  });
}
