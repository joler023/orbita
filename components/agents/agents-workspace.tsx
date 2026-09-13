"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PermissionState } from "@/components/ui/permission-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { deleteAiAgent, listAiAgents, setAiAgentEnabled, type AiAgent } from "@/lib/api/ai-agents";
import { ApiError, toUserMessage } from "@/lib/api/errors";
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { formatAgentsMeta } from "./agent-format";
import { AgentHeader } from "./agent-header";
import { AgentList } from "./agent-list";

type LoadState = "loading" | "ready" | "forbidden" | "error";

export type AgentsWorkspaceProps = {
  tenantId: string;
};

export function AgentsWorkspace({ tenantId }: AgentsWorkspaceProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiAgent | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAiAgents(tenantId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setAgents(result);
        setSelectedId((current) =>
          current && result.some((agent) => agent.id === current) ? current : (result[0]?.id ?? null),
        );
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
  }, [tenantId, reloadKey]);

  const replaceAgent = (updated: AiAgent) => {
    setAgents((current) => current.map((agent) => (agent.id === updated.id ? updated : agent)));
  };

  const toggle = async (agent: AiAgent, isEnabled: boolean) => {
    setTogglingId(agent.id);
    replaceAgent({ ...agent, isEnabled });
    try {
      replaceAgent(await setAiAgentEnabled(tenantId, agent.id, isEnabled));
      notify(isEnabled ? `${agent.name} ya responde a tus clientes.` : `${agent.name} quedó en pausa.`, "success");
    } catch (error) {
      replaceAgent(agent);
      notify(toUserMessage(error), "error");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteAiAgent(tenantId, pendingDelete.id);
      const remaining = agents.filter((agent) => agent.id !== pendingDelete.id);
      setAgents(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      notify(`Eliminaste a ${pendingDelete.name}.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPendingDelete(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]" aria-busy="true" aria-label="Cargando asistentes">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <PermissionState
        title="Necesitas permiso de administrador"
        description="Solo el dueño o un administrador pueden configurar los asistentes. Pídele acceso a quien administra tu organización."
      />
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar tus asistentes"
        description="Revisa tu conexión. Si sigue pasando, vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={<Bot className="size-8" aria-hidden="true" />}
        title="Tu asistente atiende mientras tu equipo descansa"
        description="Un asistente responde a tus clientes con lo que sabe de tu negocio, a cualquier hora, y te pasa la conversación cuando hace falta una persona."
      />
    );
  }

  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0];
  const activeCount = agents.filter((agent) => agent.isEnabled).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{formatAgentsMeta(agents.length, activeCount)}</p>
      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
        <AgentList agents={agents} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
        {selected ? (
          <section
            aria-label={`Configuración de ${selected.name}`}
            className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-5"
          >
            <AgentHeader
              agent={selected}
              toggling={togglingId === selected.id}
              onToggle={(isEnabled) => void toggle(selected, isEnabled)}
              onDelete={() => setPendingDelete(selected)}
            />
          </section>
        ) : null}
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`¿Eliminar a ${pendingDelete?.name ?? "este asistente"}?`}
        consequence="Dejará de responder y se borrarán también los documentos que consulta. No se puede deshacer; si solo quieres que deje de responder, ponlo en pausa."
        confirmLabel="Eliminar asistente"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
