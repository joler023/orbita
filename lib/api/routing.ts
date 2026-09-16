import type { ChannelKind } from "./channels";
import { apiRequest } from "./client";

export const ROUTING_RULES_MAX = 50;
export const ROUTING_RULE_NAME_MAX_LENGTH = 120;
export const ROUTING_RULE_KEYWORD_MAX_LENGTH = 120;

/**
 * Who takes a conversation. Rules are evaluated in array order and the first match wins, so
 * the order is part of the data, not a display preference — reordering is a PUT.
 *
 * `channel: null` and `keyword: null` mean "any". `agentId: null` means the team takes it.
 */
export type RoutingRule = {
  name: string;
  channel: ChannelKind | null;
  keyword: string | null;
  agentId: string | null;
};

/**
 * What the API adds when it stores a rule. `position` mirrors the array index, so the list
 * order stays the single source of truth and nothing here is ever edited by hand.
 */
export type StoredRoutingRule = RoutingRule & {
  id: string;
  position: number;
};

function rulesPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/routing/rules`;
}

export function listRoutingRules(tenantId: string): Promise<StoredRoutingRule[]> {
  return apiRequest<StoredRoutingRule[]>(rulesPath(tenantId));
}

/**
 * Replaces the whole list: the array that goes up is the evaluation order that comes back.
 * Reads are a bare array but the write is wrapped in `{ rules }`, so the asymmetry lives here
 * and nowhere else.
 */
export function saveRoutingRules(
  tenantId: string,
  rules: ReadonlyArray<RoutingRule>,
): Promise<StoredRoutingRule[]> {
  return apiRequest<StoredRoutingRule[]>(rulesPath(tenantId), {
    method: "PUT",
    body: JSON.stringify({ rules: rules.map(toWriteShape) }),
  });
}

/** `id` and `position` belong to the server: sending them back would invite them to disagree. */
function toWriteShape(rule: RoutingRule): RoutingRule {
  return {
    name: rule.name,
    channel: rule.channel,
    keyword: rule.keyword,
    agentId: rule.agentId,
  };
}

/** Mirrors what the API refuses, plus the one thing it cannot know: a rule nobody can read. */
export function validateRoutingRules(rules: ReadonlyArray<RoutingRule>): string | null {
  if (rules.length > ROUTING_RULES_MAX) {
    return `Puedes tener hasta ${ROUTING_RULES_MAX} reglas.`;
  }
  const unnamed = rules.findIndex((rule) => rule.name.trim().length === 0);
  if (unnamed >= 0) {
    return `Ponle un nombre a la regla ${unnamed + 1}, para saber qué hace sin abrirla.`;
  }
  const tooLong = rules.find((rule) => rule.name.length > ROUTING_RULE_NAME_MAX_LENGTH);
  if (tooLong) {
    return `Los nombres pueden tener hasta ${ROUTING_RULE_NAME_MAX_LENGTH} caracteres.`;
  }
  const longKeyword = rules.findIndex(
    (rule) => (rule.keyword?.length ?? 0) > ROUTING_RULE_KEYWORD_MAX_LENGTH,
  );
  if (longKeyword >= 0) {
    return `La palabra de la regla ${longKeyword + 1} puede tener hasta ${ROUTING_RULE_KEYWORD_MAX_LENGTH} caracteres.`;
  }
  return null;
}

/**
 * A rule with no channel and no keyword matches everything, so nothing below it is ever read.
 * The API accepts it; the owner almost never means it. Returns the index, or -1.
 */
export function indexOfRuleThatSwallowsTheRest(rules: ReadonlyArray<RoutingRule>): number {
  const index = rules.findIndex((rule) => rule.channel === null && !rule.keyword?.trim());
  return index >= 0 && index < rules.length - 1 ? index : -1;
}
