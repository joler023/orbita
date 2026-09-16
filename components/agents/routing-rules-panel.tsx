"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import type { AiAgent } from "@/lib/api/ai-agents";
import type { ChannelKind } from "@/lib/api/channels";
import { toUserMessage } from "@/lib/api/errors";
import {
  indexOfRuleThatSwallowsTheRest,
  listRoutingRules,
  ROUTING_RULE_KEYWORD_MAX_LENGTH,
  ROUTING_RULE_NAME_MAX_LENGTH,
  ROUTING_RULES_MAX,
  saveRoutingRules,
  validateRoutingRules,
  type RoutingRule,
} from "@/lib/api/routing";
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const CHANNEL_LABELS: Record<ChannelKind, string> = {
  WhatsApp: "WhatsApp",
  Instagram: "Instagram",
  TikTok: "TikTok",
};

const ANY = "any";
const TEAM = "team";

type LoadState = "loading" | "ready" | "error";

export type RoutingRulesPanelProps = {
  tenantId: string;
  agents: ReadonlyArray<AiAgent>;
};

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500";

export function RoutingRulesPanel({ tenantId, agents }: RoutingRulesPanelProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listRoutingRules(tenantId)
      .then((result) => {
        if (!cancelled) {
          setRules(result);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadKey]);

  const update = (index: number, changes: Partial<RoutingRule>) => {
    setRules((current) =>
      current.map((rule, position) => (position === index ? { ...rule, ...changes } : rule)),
    );
    setError(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    setRules((current) => {
      const next = [...current];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setError(null);
  };

  const remove = (index: number) => {
    setRules((current) => current.filter((_, position) => position !== index));
    setError(null);
  };

  const add = () => {
    setRules((current) => [
      ...current,
      { name: "", channel: null, keyword: null, agentId: agents[0]?.id ?? null },
    ]);
    setError(null);
  };

  const save = async () => {
    const problem = validateRoutingRules(rules);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      setRules(await saveRoutingRules(tenantId, rules));
      notify("Guardamos el orden. Tus conversaciones ya se reparten así.", "success");
    } catch (caught) {
      notify(toUserMessage(caught), "error");
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando reglas">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar las reglas"
        description="Tus asistentes siguen atendiendo como antes. Vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  const swallowIndex = indexOfRuleThatSwallowsTheRest(rules);
  const full = rules.length >= ROUTING_RULES_MAX;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Cuando llega una conversación nueva, se revisan de arriba abajo y{" "}
        <strong className="font-medium text-foreground">gana la primera que coincida</strong>. Si
        ninguna coincide, la atiende tu equipo.
      </p>

      {rules.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
          Todavía no hay reglas, así que todas las conversaciones llegan a tu equipo.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {/* Keyed by position on purpose: a PUT replaces the list, so the ids the API returns
              are new on every save. `key={rule.id}` would look tidier and break after saving. */}
          {rules.map((rule, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orbita-50 text-xs font-semibold text-orbita-600"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label={`Nombre de la regla ${index + 1}`}
                    placeholder="Por ejemplo: pedidos por WhatsApp"
                    maxLength={ROUTING_RULE_NAME_MAX_LENGTH}
                    value={rule.name}
                    disabled={saving}
                    onChange={(event) => update(index, { name: event.target.value })}
                  />
                </div>
                <div className="flex shrink-0 items-center gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={saving || index === 0}
                    aria-label={`Subir la regla ${index + 1}`}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={saving || index === rules.length - 1}
                    aria-label={`Bajar la regla ${index + 1}`}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={saving}
                    aria-label={`Eliminar la regla ${index + 1}`}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 pl-8 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Llega por</span>
                  <select
                    className={selectClass}
                    value={rule.channel ?? ANY}
                    disabled={saving}
                    onChange={(event) =>
                      update(index, {
                        channel: event.target.value === ANY ? null : (event.target.value as ChannelKind),
                      })
                    }
                  >
                    <option value={ANY}>Cualquier canal</option>
                    {Object.entries(CHANNEL_LABELS).map(([kind, label]) => (
                      <option key={kind} value={kind}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Y menciona</span>
                  <input
                    type="text"
                    className={selectClass}
                    placeholder="cualquier cosa"
                    maxLength={ROUTING_RULE_KEYWORD_MAX_LENGTH}
                    value={rule.keyword ?? ""}
                    disabled={saving}
                    onChange={(event) =>
                      update(index, { keyword: event.target.value.length > 0 ? event.target.value : null })
                    }
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">La atiende</span>
                  <select
                    className={selectClass}
                    value={rule.agentId ?? TEAM}
                    disabled={saving}
                    onChange={(event) =>
                      update(index, { agentId: event.target.value === TEAM ? null : event.target.value })
                    }
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                    <option value={TEAM}>Mi equipo</option>
                  </select>
                </label>
              </div>

              {swallowIndex === index ? (
                <p className="ml-8 flex items-start gap-1.5 rounded-lg border border-warning-border bg-warning-bg px-2.5 py-1.5 text-xs text-warning-fg">
                  <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                  Esta regla no filtra nada, así que se lleva todas las conversaciones y las de abajo
                  nunca se revisan. Déjala de última o dale un canal o una palabra.
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {error ? (
        <p role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={add}
          disabled={saving || full}
          leadingIcon={<Plus className="size-4" aria-hidden="true" />}
        >
          Agregar regla
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Guardando…" : "Guardar reglas"}
        </Button>
      </div>
    </div>
  );
}
