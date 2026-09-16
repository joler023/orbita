"use client";

import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

const INCLUDED_CONVERSATIONS = 1_000;
const EXTRA_CONVERSATION_COST = 40;
const INCLUDED_AI_CREDITS = 50_000;
const EXTRA_CREDIT_COST = 2;

export default function PreciosPage() {
  const [conversations, setConversations] = useState(1_200);
  const [credits, setCredits] = useState(60_000);
  const [basePlan, setBasePlan] = useState(149_000);

  const estimate = useMemo(() => {
    const extraConversations = Math.max(0, conversations - INCLUDED_CONVERSATIONS);
    const extraCredits = Math.max(0, credits - INCLUDED_AI_CREDITS);
    const overage =
      extraConversations * EXTRA_CONVERSATION_COST + extraCredits * EXTRA_CREDIT_COST;
    return {
      overage,
      total: basePlan + overage,
      extraConversations,
      extraCredits,
    };
  }, [basePlan, conversations, credits]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">Borrador · Precios</p>
        <h1 className="text-3xl font-semibold text-orbita-900">Cobro por consumo</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Simulador tosco para explicar el modelo. Los números son placeholders hasta
          que facturación confirme los planes reales.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          name="base"
          label="Plan base (COP / mes)"
          type="number"
          value={basePlan}
          onChange={(event) => setBasePlan(Number(event.target.value) || 0)}
        />
        <Input
          name="conversations"
          label="Conversaciones / mes"
          type="number"
          value={conversations}
          onChange={(event) => setConversations(Number(event.target.value) || 0)}
        />
        <Input
          name="credits"
          label="Créditos de IA / mes"
          type="number"
          value={credits}
          onChange={(event) => setCredits(Number(event.target.value) || 0)}
        />
      </div>

      <div className="rounded-xl border border-dashed border-border bg-orbita-50/40 p-5">
        <p className="text-sm text-muted">
          Incluye {INCLUDED_CONVERSATIONS.toLocaleString("es-CO")} conversaciones y{" "}
          {INCLUDED_AI_CREDITS.toLocaleString("es-CO")} créditos.
        </p>
        <p className="mt-2 text-sm text-muted">
          Excedente: {estimate.extraConversations.toLocaleString("es-CO")} conversaciones ·{" "}
          {estimate.extraCredits.toLocaleString("es-CO")} créditos ·{" "}
          {estimate.overage.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
        </p>
        <p className="mt-4 text-2xl font-semibold text-orbita-900">
          Total estimado:{" "}
          {estimate.total.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>
  );
}
