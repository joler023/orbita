"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  clearModelPreference,
  listAiProviders,
  listModelPreferences,
  primaryProvider,
  LLM_TASKS,
  MODEL_ID_MAX_LENGTH,
  setModelPreference,
  TASK_COPY,
  validateModelId,
  type AiProvider,
  type LlmTask,
  type ModelPreference,
} from "@/lib/api/ai-models";
import { toUserMessage } from "@/lib/api/errors";
import { PlugZap, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

type LoadState = "loading" | "ready" | "no-provider" | "error";

export type ModelPreferencesPanelProps = {
  tenantId: string;
};

export function ModelPreferencesPanel({ tenantId }: ModelPreferencesPanelProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [provider, setProvider] = useState<AiProvider | null>(null);
  const [preferences, setPreferences] = useState<ModelPreference[]>([]);
  const [drafts, setDrafts] = useState<Partial<Record<LlmTask, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<LlmTask, string>>>({});
  const [busyTask, setBusyTask] = useState<LlmTask | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Model ids belong to a provider, so the screen edits the one answering today.
    listAiProviders()
      .then(async (providers) => {
        const primary = primaryProvider(providers);
        if (!primary) {
          if (!cancelled) {
            setState("no-provider");
          }
          return;
        }
        const result = await listModelPreferences(tenantId, primary.name);
        if (!cancelled) {
          setProvider(primary);
          setPreferences(result);
          setDrafts({});
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

  const apply = (saved: ModelPreference) => {
    setPreferences((current) => {
      const rest = current.filter((preference) => preference.task !== saved.task);
      return [...rest, saved];
    });
    setDrafts((current) => ({ ...current, [saved.task]: undefined }));
  };

  const save = async (task: LlmTask, model: string) => {
    const problem = validateModelId(model);
    if (problem) {
      setErrors((current) => ({ ...current, [task]: problem }));
      return;
    }
    setErrors((current) => ({ ...current, [task]: undefined }));
    setBusyTask(task);
    try {
      if (!provider) {
        return;
      }
      apply(await setModelPreference(tenantId, provider.name, task, model.trim()));
      notify("Guardamos el cambio. Tu asistente lo usa en la próxima respuesta.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyTask(null);
    }
  };

  const reset = async (task: LlmTask) => {
    if (!provider) {
      return;
    }
    setBusyTask(task);
    try {
      await clearModelPreference(tenantId, provider.name, task);
      const fresh = await listModelPreferences(tenantId, provider.name);
      setPreferences(fresh);
      setDrafts((current) => ({ ...current, [task]: undefined }));
      notify("Volvimos al modelo por defecto.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyTask(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando modelos">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (state === "no-provider") {
    return (
      <EmptyState
        icon={<PlugZap className="size-8" aria-hidden="true" />}
        title="No hay ningún proveedor de IA conectado"
        description="Mientras no haya uno configurado en el servidor, no hay modelos que elegir y tus asistentes no pueden responder. Avísale a quien administra Órbita."
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar esta sección"
        description="Tus asistentes siguen respondiendo igual. Vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Cada asistente usa un modelo distinto según lo que esté haciendo. Uno económico para
        entender el mensaje y uno mejor para escribir la respuesta cuesta bastante menos que usar
        el mejor para todo. Si no eliges nada, se usa el que trae Órbita.
      </p>
      {provider ? (
        <p className="-mt-3 text-xs text-muted">
          Modelos de <span className="font-medium text-foreground">{provider.displayName}</span>, el
          proveedor que responde hoy.
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {LLM_TASKS.map((task) => {
          const preference = preferences.find((item) => item.task === task);
          const current = preference?.model ?? "";
          const draft = drafts[task] ?? current;
          const busy = busyTask === task;
          const changed = draft.trim() !== current;
          return (
            <li key={task} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{TASK_COPY[task].title}</span>
                {preference?.isTenantOverride ? (
                  <StatusBadge tone="info" label="Lo elegiste tú" />
                ) : (
                  <StatusBadge tone="neutral" label="El de por defecto" />
                )}
              </div>
              <p className="text-xs text-muted">{TASK_COPY[task].description}</p>

              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label={`Modelo para ${TASK_COPY[task].title.toLowerCase()}`}
                    value={draft}
                    maxLength={MODEL_ID_MAX_LENGTH}
                    disabled={busy}
                    error={errors[task]}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDrafts((state) => ({ ...state, [task]: value }));
                      setErrors((state) => ({ ...state, [task]: undefined }));
                    }}
                  />
                </div>
                <Button size="sm" disabled={busy || !changed} onClick={() => void save(task, draft)}>
                  {busy ? "Guardando…" : "Guardar"}
                </Button>
                {preference?.isTenantOverride ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => void reset(task)}
                    leadingIcon={<RotateCcw className="size-4" aria-hidden="true" />}
                  >
                    Volver al de por defecto
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs text-warning-fg">
        El identificador se escribe tal cual lo nombra el proveedor y no se comprueba aquí. Si te
        equivocas, no lo verás ahora: tu asistente dejará de responder en la siguiente
        conversación. Después de cambiarlo, pruébalo en la pestaña Pruebas de un asistente.
      </p>
    </div>
  );
}
