"use client";

import { Button } from "@/components/ui/button";
import { RadioCardGroup } from "@/components/ui/radio-card-group";
import { TagField } from "@/components/ui/tag-field";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  BLOCKED_TOPICS_MAX,
  BLOCKED_TOPIC_MAX_LENGTH,
  OUT_OF_SCOPE_REPLY_MAX_LENGTH,
  saveAgentGuardrails,
  saveBusinessHours,
  validateGuardrails,
  type AgentGuardrails,
  type AiAgent,
  type BusinessHours,
} from "@/lib/api/ai-agents";
import { toUserMessage } from "@/lib/api/errors";
import { useState } from "react";

type Duty = "always" | "outsideBusinessHours";

const DUTY_OPTIONS = [
  {
    value: "always" as const,
    title: "Siempre",
    description: "Atiende a cualquier hora, todos los días.",
  },
  {
    value: "outsideBusinessHours" as const,
    title: "Solo fuera del horario laboral",
    disabledReason: "Llega cuando puedas definir el horario de tu negocio.",
  },
];

export type AgentGuardrailsPanelProps = {
  tenantId: string;
  agentId: string;
  guardrails: AgentGuardrails;
  businessHours: BusinessHours | null;
  onSaved: (agent: AiAgent) => void;
};

function isSame(a: AgentGuardrails, b: AgentGuardrails): boolean {
  return (
    a.outOfScopeReply === b.outOfScopeReply &&
    a.blockedTopics.length === b.blockedTopics.length &&
    a.blockedTopics.every((topic, index) => topic === b.blockedTopics[index])
  );
}

export function AgentGuardrailsPanel({
  tenantId,
  agentId,
  guardrails,
  businessHours,
  onSaved,
}: AgentGuardrailsPanelProps) {
  const { notify } = useToast();
  const [topics, setTopics] = useState<string[]>(guardrails.blockedTopics);
  const [reply, setReply] = useState(guardrails.outOfScopeReply);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const duty: Duty = businessHours ? "outsideBusinessHours" : "always";

  // Only "always" is reachable for now, so the single move this offers is going back to it.
  const changeDuty = async (next: Duty) => {
    if (next !== "always" || duty === "always") {
      return;
    }
    setSaving(true);
    try {
      onSaved(await saveBusinessHours(tenantId, agentId, null));
      notify("Tu asistente vuelve a atender a cualquier hora.", "success");
    } catch (caught) {
      notify(toUserMessage(caught), "error");
    } finally {
      setSaving(false);
    }
  };

  const current: AgentGuardrails = { blockedTopics: topics, outOfScopeReply: reply };
  const dirty = !isSame(current, guardrails);

  const save = async () => {
    const problem = validateGuardrails(current);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const saved = await saveAgentGuardrails(tenantId, agentId, current);
      setTopics(saved.guardrails.blockedTopics);
      setReply(saved.guardrails.outOfScopeReply);
      onSaved(saved);
      notify("Listo. Tu asistente ya respeta estos límites.", "success");
    } catch (caught) {
      notify(toUserMessage(caught), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs text-info-fg">
        Esto empieza a regir apenas lo guardes, sin esperar a que publiques.
      </p>

      <RadioCardGroup
        name="duty"
        legend="¿Cuándo trabaja?"
        options={DUTY_OPTIONS}
        value={duty}
        onChange={(next) => void changeDuty(next)}
        disabled={saving}
      />

      <TagField
        label="¿De qué prefieres que no hable?"
        hint="Escribe una palabra y pulsa Enter. Se busca la palabra completa, así que si escribes «precio» agrega también «precios»."
        value={topics}
        onChange={(next) => {
          setTopics(next);
          setError(null);
        }}
        maxTags={BLOCKED_TOPICS_MAX}
        maxTagLength={BLOCKED_TOPIC_MAX_LENGTH}
        placeholder="Por ejemplo: dosis"
        removeLabel={(topic) => `Quitar ${topic}`}
        disabled={saving}
      />

      <Textarea
        name="outOfScopeReply"
        label="¿Qué responde cuando no puede hablar de eso?"
        hint="Lo lee tu cliente tal cual, así que escríbelo con la voz de tu negocio."
        value={reply}
        maxLength={OUT_OF_SCOPE_REPLY_MAX_LENGTH}
        rows={3}
        disabled={saving}
        onChange={(event) => {
          setReply(event.target.value);
          setError(null);
        }}
      />

      {error ? (
        <p role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border pt-4">
        <Button size="sm" onClick={() => void save()} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar límites"}
        </Button>
      </div>
    </div>
  );
}
