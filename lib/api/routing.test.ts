import { afterEach, describe, expect, it, vi } from "vitest";
import { resetRefreshLock } from "./client";
import {
  indexOfRuleThatSwallowsTheRest,
  listRoutingRules,
  ROUTING_RULES_MAX,
  saveRoutingRules,
  validateRoutingRules,
  type RoutingRule,
} from "./routing";

const tenantId = "11111111-1111-4111-8111-111111111111";

function rule(overrides: Partial<RoutingRule> = {}): RoutingRule {
  return { name: "Ventas", channel: "WhatsApp", keyword: null, agentId: "a1", ...overrides };
}

function stubJson(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("routing rules api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("reads a bare array, which is the shape the API actually returns", async () => {
    const stored = { ...rule(), id: "r1", position: 0 };
    const fetchMock = stubJson([stored]);

    await expect(listRoutingRules(tenantId)).resolves.toEqual([stored]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `http://localhost:5091/api/tenants/${tenantId}/routing/rules`,
    );
  });

  it("wraps the write in { rules }, because only the read is a bare array", async () => {
    const rules = [rule({ name: "Primera" }), rule({ name: "Segunda" })];
    const fetchMock = stubJson([]);

    await saveRoutingRules(tenantId, rules);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ rules });
  });

  it("never sends back the id or position the server assigned", async () => {
    const fetchMock = stubJson([]);

    await saveRoutingRules(tenantId, [{ ...rule(), id: "r1", position: 3 } as RoutingRule]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [sent] = (JSON.parse(init.body as string) as { rules: Record<string, unknown>[] }).rules;
    expect(sent).not.toHaveProperty("id");
    expect(sent).not.toHaveProperty("position");
  });
});

describe("validateRoutingRules", () => {
  it("accepts an ordinary list", () => {
    expect(validateRoutingRules([rule()])).toBeNull();
  });

  it("points at the rule that has no name, by its position", () => {
    expect(validateRoutingRules([rule(), rule({ name: "  " })])).toBe(
      "Ponle un nombre a la regla 2, para saber qué hace sin abrirla.",
    );
  });

  it("refuses a keyword longer than the API allows, naming the rule", () => {
    expect(validateRoutingRules([rule(), rule({ keyword: "x".repeat(121) })])).toBe(
      "La palabra de la regla 2 puede tener hasta 120 caracteres.",
    );
  });

  it("refuses more rules than the API allows", () => {
    const tooMany = Array.from({ length: ROUTING_RULES_MAX + 1 }, () => rule());

    expect(validateRoutingRules(tooMany)).toBe("Puedes tener hasta 50 reglas.");
  });
});

describe("indexOfRuleThatSwallowsTheRest", () => {
  it("finds a catch-all that leaves the rules below it unreachable", () => {
    const rules = [rule({ channel: null, keyword: null }), rule({ name: "Nunca se lee" })];

    expect(indexOfRuleThatSwallowsTheRest(rules)).toBe(0);
  });

  it("treats blank spaces as no keyword at all", () => {
    const rules = [rule({ channel: null, keyword: "   " }), rule()];

    expect(indexOfRuleThatSwallowsTheRest(rules)).toBe(0);
  });

  it("says nothing when the catch-all is last, which is where it belongs", () => {
    const rules = [rule(), rule({ channel: null, keyword: null })];

    expect(indexOfRuleThatSwallowsTheRest(rules)).toBe(-1);
  });

  it("says nothing when every rule narrows something", () => {
    expect(indexOfRuleThatSwallowsTheRest([rule(), rule({ keyword: "factura" })])).toBe(-1);
  });
});
