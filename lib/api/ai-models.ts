import { apiRequest } from "./client";

/**
 * Which model serves each task, per organization (ORB-C13). Model ids are not portable
 * between providers, so the provider is part of the route.
 *
 * TODO(ORB-C13): the API has no endpoint that lists the configured providers yet — asked for
 * `GET /api/ai-providers`. Until it exists this is the one the deployment uses; the other
 * registered name is "ollama", left unconfigured.
 */
export const AI_PROVIDER = "openai-compatible";

export const LLM_TASKS = ["Classify", "Draft", "Embed"] as const;

export type LlmTask = (typeof LLM_TASKS)[number];

export const MODEL_ID_MAX_LENGTH = 120;

/** `isTenantOverride` separates "this organization chose it" from "it is the default". */
export type ModelPreference = {
  task: LlmTask;
  model: string;
  isTenantOverride: boolean;
};

function modelsPath(tenantId: string, provider: string): string {
  return `/api/tenants/${tenantId}/ai-models/${provider}`;
}

export function listModelPreferences(
  tenantId: string,
  provider: string = AI_PROVIDER,
): Promise<ModelPreference[]> {
  return apiRequest<ModelPreference[]>(modelsPath(tenantId, provider));
}

export function setModelPreference(
  tenantId: string,
  task: LlmTask,
  model: string,
  provider: string = AI_PROVIDER,
): Promise<ModelPreference> {
  return apiRequest<ModelPreference>(`${modelsPath(tenantId, provider)}/${task}`, {
    method: "PUT",
    body: JSON.stringify({ model }),
  });
}

/** Back to the deployment default. Clearing something already absent is not an error. */
export function clearModelPreference(
  tenantId: string,
  task: LlmTask,
  provider: string = AI_PROVIDER,
): Promise<void> {
  return apiRequest<void>(`${modelsPath(tenantId, provider)}/${task}`, { method: "DELETE" });
}

export type TaskCopy = {
  title: string;
  description: string;
};

/** What each task is, for someone who runs the business rather than the models. */
export const TASK_COPY: Record<LlmTask, TaskCopy> = {
  Classify: {
    title: "Entender de qué se trata",
    description:
      "Clasifica cada mensaje antes de responder. Pasa en todas las conversaciones, así que conviene uno económico.",
  },
  Draft: {
    title: "Escribir la respuesta",
    description: "Es lo que lee tu cliente. Aquí es donde vale la pena uno mejor.",
  },
  Embed: {
    title: "Leer tus documentos",
    description:
      "Prepara lo que subes a la base de conocimiento. Cambiarlo obliga a volver a leer todo.",
  },
};

export function validateModelId(model: string): string | null {
  const trimmed = model.trim();
  if (trimmed.length === 0) {
    return "Escribe el identificador del modelo, o vuelve al de por defecto.";
  }
  if (trimmed.length > MODEL_ID_MAX_LENGTH) {
    return `El identificador puede tener hasta ${MODEL_ID_MAX_LENGTH} caracteres.`;
  }
  return null;
}
