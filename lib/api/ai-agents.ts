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
