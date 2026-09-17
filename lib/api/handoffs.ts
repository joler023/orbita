import { apiRequest } from "./client";

export const HANDOFF_REASONS = [
  "CustomerAsked",
  "Frustration",
  "OutOfScopeTopic",
  "AgentDecision",
] as const;

export type HandoffReason = (typeof HANDOFF_REASONS)[number];

/**
 * A conversation the assistant stopped answering, waiting for someone on the team.
 *
 * `summary` is null for a few seconds after the handoff: the assistant writes it after the
 * customer already got their reply, so it means "not yet", never "there is none".
 * `contactName` is optional in the API, so a contact without one still has to render.
 */
export type Handoff = {
  conversationId: string;
  contactId: string;
  contactName: string | null;
  reason: HandoffReason | string;
  requestedAt: string;
  summary: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

export type HandoffPage = {
  items: Handoff[];
  nextCursor: string | null;
  /** How many are waiting in total, not on this page. */
  total: number;
};

export const HANDOFFS_PAGE_SIZE = 25;

/** While a summary is still being written, the list refreshes on its own. */
export const HANDOFFS_POLL_INTERVAL_MS = 4_000;

export function listHandoffs(
  tenantId: string,
  page: { cursor?: string | null; limit?: number } = {},
): Promise<HandoffPage> {
  const params = new URLSearchParams({ limit: String(page.limit ?? HANDOFFS_PAGE_SIZE) });
  if (page.cursor) {
    params.set("cursor", page.cursor);
  }
  return apiRequest<HandoffPage>(`/api/tenants/${tenantId}/handoffs?${params.toString()}`);
}

/** Puts the conversation back with the assistant. Doing it twice is not an error. */
export function returnToAssistant(tenantId: string, conversationId: string): Promise<void> {
  return apiRequest<void>(
    `/api/tenants/${tenantId}/conversations/${conversationId}/return-to-assistant`,
    { method: "POST" },
  );
}

/** Why the assistant stepped aside, in the owner's words. Unknown reasons say nothing. */
export function describeHandoffReason(reason: string): string | null {
  switch (reason) {
    case "CustomerAsked":
      return "Pidió hablar con una persona";
    case "Frustration":
      return "Se notó molesto o repitió lo mismo";
    case "OutOfScopeTopic":
      return "Preguntó por un tema que bloqueaste";
    case "AgentDecision":
      return "Tu asistente no pudo seguir";
    default:
      return null;
  }
}

export function isWaitingForSummary(page: Pick<HandoffPage, "items">): boolean {
  return page.items.some((handoff) => handoff.summary === null);
}
