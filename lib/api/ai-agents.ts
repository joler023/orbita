import { apiRequest } from "./client";

export const AGENT_TONES = ["Formal", "Balanced", "Conversational"] as const;

export type AgentTone = (typeof AGENT_TONES)[number];

export const AGENT_NAME_MAX_LENGTH = 120;
export const AGENT_PERSONALITY_MAX_LENGTH = 2_000;
export const AGENT_INSTRUCTIONS_MAX_LENGTH = 8_000;

export type AiAgent = {
  id: string;
  name: string;
  personality: string;
  instructions: string;
  tone: AgentTone;
  tools: string[];
  isEnabled: boolean;
  conversationCount: number;
  createdAt: string;
};

export type SaveAiAgentRequest = {
  name: string;
  personality: string;
  instructions: string;
  tone: AgentTone;
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

export function updateAiAgent(
  tenantId: string,
  agentId: string,
  body: SaveAiAgentRequest,
): Promise<AiAgent> {
  return apiRequest<AiAgent>(`${agentsPath(tenantId)}/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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

export function toSaveRequest(agent: AiAgent): SaveAiAgentRequest {
  return {
    name: agent.name,
    personality: agent.personality,
    instructions: agent.instructions,
    tone: agent.tone,
    tools: agent.tools,
  };
}
