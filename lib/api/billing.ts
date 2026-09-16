import { apiRequest } from "./client";

export type PaymentProvider = "Stripe" | "Wompi";
export type SubscriptionStatus = "Active" | "PastDue" | "Canceled" | "Trialing" | "Incomplete";

export type Plan = {
  id: string;
  code: string;
  name: string;
  includedConversations: number;
  includedAiCredits: number;
  priceAmount: number;
  priceCurrency: string;
};

export type Subscription = {
  id: string;
  planId: string;
  planCode: string;
  planName: string;
  provider: PaymentProvider;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
};

export type Invoice = {
  id: string;
  issuedAt: string;
  amountDue: number;
  currency: string;
  status: string;
  downloadUrl: string | null;
};

function subscriptionPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/subscription`;
}

export function listPlans(): Promise<Plan[]> {
  return apiRequest<Plan[]>("/api/plans");
}

/** `null` means the tenant has no subscription yet — not an error. */
export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  try {
    return await apiRequest<Subscription>(subscriptionPath(tenantId));
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export function subscribe(
  tenantId: string,
  planId: string,
  paymentMethodToken: string,
): Promise<Subscription> {
  return apiRequest<Subscription>(subscriptionPath(tenantId), {
    method: "POST",
    body: JSON.stringify({ planId, paymentMethodToken }),
  });
}

export function changePlan(tenantId: string, planId: string): Promise<Subscription> {
  return apiRequest<Subscription>(subscriptionPath(tenantId), {
    method: "PATCH",
    body: JSON.stringify({ planId }),
  });
}

export function cancelSubscription(tenantId: string): Promise<void> {
  return apiRequest<void>(subscriptionPath(tenantId), { method: "DELETE" });
}

export function listInvoices(tenantId: string): Promise<Invoice[]> {
  return apiRequest<Invoice[]>(`${subscriptionPath(tenantId)}/invoices`);
}

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}
