import {
  AGENT_INSTRUCTIONS_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  AGENT_PERSONALITY_MAX_LENGTH,
  type SaveAiAgentRequest,
} from "@/lib/api/ai-agents";

export type AgentDraftErrors = Partial<Record<"name" | "personality" | "instructions", string>>;

export function emptyAgentDraft(): SaveAiAgentRequest {
  return { name: "", personality: "", instructions: "", tone: "Balanced", tools: [] };
}

export function validateAgentDraft(draft: SaveAiAgentRequest): AgentDraftErrors {
  const errors: AgentDraftErrors = {};
  const name = requiredWithin(draft.name, AGENT_NAME_MAX_LENGTH, "Ponle un nombre a tu asistente.");
  const personality = requiredWithin(
    draft.personality,
    AGENT_PERSONALITY_MAX_LENGTH,
    "Describe cómo habla tu asistente.",
  );
  const instructions = requiredWithin(
    draft.instructions,
    AGENT_INSTRUCTIONS_MAX_LENGTH,
    "Cuéntale a tu asistente qué hace y qué nunca debe hacer.",
  );
  if (name) {
    errors.name = name;
  }
  if (personality) {
    errors.personality = personality;
  }
  if (instructions) {
    errors.instructions = instructions;
  }
  return errors;
}

export function hasDraftErrors(errors: AgentDraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function isSameDraft(a: SaveAiAgentRequest, b: SaveAiAgentRequest): boolean {
  return (
    a.name === b.name &&
    a.personality === b.personality &&
    a.instructions === b.instructions &&
    a.tone === b.tone &&
    a.tools.length === b.tools.length &&
    a.tools.every((tool) => b.tools.includes(tool))
  );
}

export function normalizeDraft(draft: SaveAiAgentRequest): SaveAiAgentRequest {
  return {
    ...draft,
    name: draft.name.trim(),
    personality: draft.personality.trim(),
    instructions: draft.instructions.trim(),
  };
}

function requiredWithin(value: string, max: number, emptyMessage: string): string | null {
  const length = value.trim().length;
  if (length === 0) {
    return emptyMessage;
  }
  if (length > max) {
    return `Usa como máximo ${new Intl.NumberFormat("es-CO").format(max)} caracteres. Ahora tiene ${new Intl.NumberFormat("es-CO").format(length)}.`;
  }
  return null;
}
