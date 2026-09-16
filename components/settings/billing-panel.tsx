"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PermissionState } from "@/components/ui/permission-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { canManageBilling, type MemberRole } from "@/lib/api/auth";
import {
  cancelSubscription,
  changePlan,
  getSubscription,
  listInvoices,
  listPlans,
  subscribe,
  type Invoice,
  type Plan,
  type Subscription,
} from "@/lib/api/billing";
import { ApiError, toUserMessage } from "@/lib/api/errors";
import { useEffect, useState } from "react";

type LoadState = "loading" | "ready" | "forbidden" | "error";

const STATUS_TONE: Record<Subscription["status"], StatusTone> = {
  Active: "success",
  Trialing: "info",
  PastDue: "warning",
  Incomplete: "warning",
  Canceled: "neutral",
};

const STATUS_LABEL: Record<Subscription["status"], string> = {
  Active: "Activo",
  Trialing: "En prueba",
  PastDue: "Pago pendiente",
  Incomplete: "Incompleto",
  Canceled: "Cancelado",
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function BillingPanel({ tenantId, viewerRole }: { tenantId: string; viewerRole: MemberRole }) {
  const { notify } = useToast();
  const canManage = canManageBilling(viewerRole);
  const [state, setState] = useState<LoadState>(canManage ? "loading" : "forbidden");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [choosingPlan, setChoosingPlan] = useState<Plan | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canManage) {
      return;
    }
    let cancelled = false;
    Promise.all([listPlans(), getSubscription(tenantId)])
      .then(async ([planList, currentSubscription]) => {
        if (cancelled) {
          return;
        }
        setPlans(planList);
        setSubscription(currentSubscription);
        setInvoices(currentSubscription ? await listInvoices(tenantId) : []);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState(error instanceof ApiError && error.status === 403 ? "forbidden" : "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, canManage, reloadKey]);

  const startSubscription = async (planId: string, paymentMethodToken: string) => {
    const created = await subscribe(tenantId, planId, paymentMethodToken);
    setSubscription(created);
    setInvoices(await listInvoices(tenantId));
    notify("Tu plan está activo.", "success");
  };

  const switchPlan = async (planId: string, paymentMethodToken: string) => {
    if (!subscription) {
      return startSubscription(planId, paymentMethodToken);
    }
    const updated = await changePlan(tenantId, planId);
    setSubscription(updated);
    notify("Cambiamos tu plan.", "success");
  };

  const confirmCancel = async () => {
    try {
      await cancelSubscription(tenantId);
      setSubscription((current) => (current ? { ...current, status: "Canceled" } : current));
      notify("Cancelamos tu suscripción.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setConfirmingCancel(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando facturación">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <PermissionState
        title="Solo el dueño ve la facturación"
        description="Contratar, cambiar o cancelar el plan, y ver las facturas, es exclusivo del dueño de la organización."
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar tu facturación"
        description="Revisa tu conexión. Si sigue pasando, vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {subscription ? (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{subscription.planName}</h3>
              <p className="text-sm text-muted">
                {subscription.currentPeriodEnd
                  ? `Se renueva el ${new Date(subscription.currentPeriodEnd).toLocaleDateString("es-CO")}`
                  : "Sin fecha de renovación"}
              </p>
            </div>
            <StatusBadge tone={STATUS_TONE[subscription.status]} label={STATUS_LABEL[subscription.status]} />
          </div>
          {subscription.status !== "Canceled" ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setChoosingPlan(plans[0] ?? null)}>
                Cambiar de plan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingCancel(true)}>
                Cancelar suscripción
              </Button>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-muted">Todavía no tienes un plan contratado. Elige uno para seguir usando Órbita.</p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
            <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
            <p className="text-2xl font-semibold text-foreground">
              {formatMoney(plan.priceAmount, plan.priceCurrency)}
              <span className="text-sm font-normal text-muted"> / mes</span>
            </p>
            <ul className="flex flex-col gap-1 text-sm text-muted">
              <li>{plan.includedConversations.toLocaleString("es-CO")} conversaciones incluidas</li>
              <li>{plan.includedAiCredits.toLocaleString("es-CO")} créditos de IA incluidos</li>
            </ul>
            <Button
              size="sm"
              variant={subscription?.planId === plan.id ? "secondary" : "primary"}
              disabled={subscription?.planId === plan.id}
              onClick={() => setChoosingPlan(plan)}
            >
              {subscription?.planId === plan.id ? "Plan actual" : subscription ? "Cambiar a este plan" : "Elegir plan"}
            </Button>
          </article>
        ))}
      </section>

      {invoices.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-foreground">Facturas</h3>
          <Table
            caption="Facturas"
            columns={[
              { key: "date", header: "Fecha" },
              { key: "amount", header: "Monto" },
              { key: "status", header: "Estado" },
              { key: "download", header: "" },
            ]}
          >
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm">{new Date(invoice.issuedAt).toLocaleDateString("es-CO")}</td>
                <td className="px-4 py-3 text-sm">{formatMoney(invoice.amountDue, invoice.currency)}</td>
                <td className="px-4 py-3 text-sm">{invoice.status}</td>
                <td className="px-4 py-3 text-right">
                  {invoice.downloadUrl ? (
                    <a href={invoice.downloadUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-orbita-600 hover:underline">
                      Descargar
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </Table>
        </section>
      ) : null}

      <PaymentMethodModal
        plan={choosingPlan}
        onClose={() => setChoosingPlan(null)}
        onConfirm={(paymentMethodToken) => switchPlan(choosingPlan!.id, paymentMethodToken)}
      />
      <ConfirmDialog
        open={confirmingCancel}
        title="¿Cancelar tu suscripción?"
        consequence="Perderás el acceso a las conversaciones incluidas y a los créditos de IA cuando termine el ciclo actual."
        confirmLabel="Cancelar suscripción"
        destructive
        onConfirm={confirmCancel}
        onClose={() => setConfirmingCancel(false)}
      />
    </div>
  );
}

/**
 * Stand-in for Stripe Elements/Wompi's widget, neither of which has real credentials
 * connected yet (see CLAUDE.md's Billing section) — collecting a raw token here instead
 * of card data keeps the same "the API never sees a card number" contract real
 * integration will have, so nothing here changes once a real widget replaces this input.
 */
function PaymentMethodModal({
  plan,
  onClose,
  onConfirm,
}: {
  plan: Plan | null;
  onClose: () => void;
  onConfirm: (paymentMethodToken: string) => Promise<void>;
}) {
  const { notify } = useToast();
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);

  if (!plan) {
    return null;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      await onConfirm(token);
      setToken("");
      onClose();
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open title={`Confirmar plan ${plan.name}`} onClose={pending ? () => undefined : onClose}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <p className="text-sm text-muted">
          Los pagos con tarjeta real todavía no están conectados. Mientras tanto, cualquier texto sirve como
          método de pago de prueba.
        </p>
        <Input
          label="Método de pago"
          name="paymentMethodToken"
          required
          placeholder="tok_test"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={pending || token.trim().length === 0}>
            {pending ? "Confirmando…" : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
