import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelSubscription,
  changePlan,
  getSubscription,
  listInvoices,
  listPlans,
  subscribe,
  type Plan,
  type Subscription,
} from "./billing";
import { resetRefreshLock } from "./client";

const tenantId = "11111111-1111-4111-8111-111111111111";

const plan: Plan = {
  id: "p1",
  code: "pro",
  name: "Pro",
  includedConversations: 1000,
  includedAiCredits: 5000,
  priceAmount: 99,
  priceCurrency: "USD",
};

const subscription: Subscription = {
  id: "s1",
  planId: "p1",
  planCode: "pro",
  planName: "Pro",
  provider: "Stripe",
  status: "Active",
  currentPeriodEnd: "2026-10-14T00:00:00+00:00",
};

function stubJson(body: unknown, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(status === 204 || status === 404 ? null : JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetchMock.mock.calls[0] as [string, RequestInit];
}

describe("billing api", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetRefreshLock();
  });

  it("lists the public plan catalog", async () => {
    const fetchMock = stubJson([plan]);

    await expect(listPlans()).resolves.toEqual([plan]);
    expect(lastCall(fetchMock)[0]).toBe("http://localhost:5091/api/plans");
  });

  it("returns the current subscription", async () => {
    stubJson(subscription);

    await expect(getSubscription(tenantId)).resolves.toEqual(subscription);
  });

  it("returns null instead of throwing when there is no subscription yet", async () => {
    stubJson(null, 404);

    await expect(getSubscription(tenantId)).resolves.toBeNull();
  });

  it("subscribes to a plan with a payment method token", async () => {
    const fetchMock = stubJson(subscription, 201);

    await subscribe(tenantId, "p1", "tok_test");

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/subscription`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ planId: "p1", paymentMethodToken: "tok_test" });
  });

  it("changes plan", async () => {
    const fetchMock = stubJson(subscription);

    await changePlan(tenantId, "p1");

    const [, init] = lastCall(fetchMock);
    expect(init.method).toBe("PATCH");
  });

  it("cancels the subscription", async () => {
    const fetchMock = stubJson(null, 204);

    await cancelSubscription(tenantId);

    const [url, init] = lastCall(fetchMock);
    expect(url).toBe(`http://localhost:5091/api/tenants/${tenantId}/subscription`);
    expect(init.method).toBe("DELETE");
  });

  it("lists invoices", async () => {
    stubJson([]);

    await expect(listInvoices(tenantId)).resolves.toEqual([]);
  });
});
