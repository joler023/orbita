import { ToastProvider } from "@/components/ui/toast";
import type { Plan, Subscription } from "@/lib/api/billing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingPanel } from "./billing-panel";

const { listPlans, getSubscription, listInvoices, subscribe, changePlan, cancelSubscription } = vi.hoisted(() => ({
  listPlans: vi.fn(),
  getSubscription: vi.fn(),
  listInvoices: vi.fn(),
  subscribe: vi.fn(),
  changePlan: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock("@/lib/api/billing", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/billing")>("@/lib/api/billing")),
  listPlans: (...args: unknown[]) => listPlans(...args),
  getSubscription: (...args: unknown[]) => getSubscription(...args),
  listInvoices: (...args: unknown[]) => listInvoices(...args),
  subscribe: (...args: unknown[]) => subscribe(...args),
  changePlan: (...args: unknown[]) => changePlan(...args),
  cancelSubscription: (...args: unknown[]) => cancelSubscription(...args),
}));

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

function renderPanel(viewerRole: "Owner" | "Admin" | "Agent" | "Viewer" = "Owner") {
  return render(
    <ToastProvider>
      <BillingPanel tenantId={tenantId} viewerRole={viewerRole} />
    </ToastProvider>,
  );
}

describe("BillingPanel", () => {
  beforeEach(() => {
    listPlans.mockReset().mockResolvedValue([plan]);
    getSubscription.mockReset().mockResolvedValue(null);
    listInvoices.mockReset().mockResolvedValue([]);
    subscribe.mockReset();
    changePlan.mockReset();
    cancelSubscription.mockReset();
  });

  it("only the owner can see billing", async () => {
    renderPanel("Admin");

    expect(await screen.findByText("Solo el dueño ve la facturación")).toBeInTheDocument();
    expect(listPlans).not.toHaveBeenCalled();
  });

  it("shows the plan catalog with no subscription yet", async () => {
    renderPanel();

    expect(await screen.findByText("Todavía no tienes un plan contratado. Elige uno para seguir usando Órbita.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Elegir plan" })).toBeInTheDocument();
  });

  it("subscribes to a plan through the payment method placeholder", async () => {
    const user = userEvent.setup();
    subscribe.mockResolvedValue(subscription);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Elegir plan" }));
    await user.type(screen.getByLabelText("Método de pago"), "tok_test");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(subscribe).toHaveBeenCalledWith(tenantId, "p1", "tok_test");
  });

  it("shows the current plan and lets the owner cancel", async () => {
    const user = userEvent.setup();
    getSubscription.mockResolvedValue(subscription);
    cancelSubscription.mockResolvedValue(undefined);
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Cancelar suscripción" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar suscripción" }));

    expect(cancelSubscription).toHaveBeenCalledWith(tenantId);
  });
});
