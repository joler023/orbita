"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PermissionState } from "@/components/ui/permission-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { deleteAiAgent, listAiAgents, setAiAgentEnabled, type AiAgent } from "@/lib/api/ai-agents";
import { ApiError, toUserMessage } from "@/lib/api/errors";
import { Bot, Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AgentEditor } from "./agent-editor";
import { formatAgentsMeta } from "./agent-format";
import { AgentHeader } from "./agent-header";
import { AgentList } from "./agent-list";

type LoadState = "loading" | "ready" | "forbidden" | "error";

type Selection = { kind: "agent"; id: string } | { kind: "new" };

export type AgentsWorkspaceProps = {
  tenantId: string;
};

export function AgentsWorkspace({ tenantId }: AgentsWorkspaceProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AiAgent | null>(null);
  const [pendingSelection, setPendingSelection] = useState<Selection | null>(null);
  const [dirty, setDirty] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listAiAgents(tenantId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setAgents(result);
        setSelection((current) => {
          if (current?.kind === "agent" && result.some((agent) => agent.id === current.id)) {
            return current;
          }
          const first = result[0];
          return first ? { kind: "agent", id: first.id } : null;
        });
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

  const select = (next: Selection) => {
    if (dirty) {
      setPendingSelection(next);
      return;
    }
    setSelection(next);
  };

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
      const first = remaining[0];
      setSelection(first ? { kind: "agent", id: first.id } : null);
      setDirty(false);
      notify(`Eliminaste a ${pendingDelete.name}.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPendingDelete(null);
    }
  };

  const onSaved = (saved: AiAgent) => {
    setAgents((current) =>
      current.some((agent) => agent.id === saved.id)
        ? current.map((agent) => (agent.id === saved.id ? saved : agent))
        : [...current, saved],
    );
    setSelection({ kind: "agent", id: saved.id });
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

  const selectedAgent =
    selection?.kind === "agent" ? agents.find((agent) => agent.id === selection.id) : undefined;

  if (agents.length === 0 && selection?.kind !== "new") {
    return (
      <EmptyState
        icon={<Bot className="size-8" aria-hidden="true" />}
        title="Tu asistente atiende mientras tu equipo descansa"
        description="Un asistente responde a tus clientes con lo que sabe de tu negocio, a cualquier hora, y te pasa la conversación cuando hace falta una persona."
        action={
          <Button leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => select({ kind: "new" })}>
            Crear mi primer asistente
          </Button>
        }
      />
    );
  }

  let detail: ReactNode = null;
  if (selection?.kind === "new") {
    detail = (
      <section
        aria-label="Nuevo asistente"
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <header className="border-b border-border pb-4">
          <h2 className="text-lg font-semibold text-foreground">Nuevo asistente</h2>
          <p className="text-sm text-muted">Queda en pausa hasta que decidas activarlo.</p>
        </header>
        <AgentEditor
          key="new"
          tenantId={tenantId}
          agent={null}
          onSaved={onSaved}
          onDirtyChange={setDirty}
          onCancelCreate={() => {
            setDirty(false);
            const first = agents[0];
            setSelection(first ? { kind: "agent", id: first.id } : null);
          }}
        />
      </section>
    );
  } else if (selectedAgent) {
    detail = (
      <section
        aria-label={`Configuración de ${selectedAgent.name}`}
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <AgentHeader
          agent={selectedAgent}
          toggling={togglingId === selectedAgent.id}
          onToggle={(isEnabled) => void toggle(selectedAgent, isEnabled)}
          onDelete={() => setPendingDelete(selectedAgent)}
        />
        <AgentEditor
          key={selectedAgent.id}
          tenantId={tenantId}
          agent={selectedAgent}
          onSaved={onSaved}
          onDirtyChange={setDirty}
        />
      </section>
    );
  }

  const activeCount = agents.filter((agent) => agent.isEnabled).length;

  return (
    <div className="grid min-h-0 items-start gap-4 lg:h-full lg:grid-cols-[240px_1fr] lg:items-stretch">
      {/* Each column scrolls on its own, so the list stays put while the form moves. */}
      <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto lg:pr-1">
        <AgentList
          agents={agents}
          selectedId={selectedAgent?.id ?? null}
          meta={formatAgentsMeta(agents.length, activeCount)}
          onSelect={(id) => select({ kind: "agent", id })}
          footer={
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              leadingIcon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() => select({ kind: "new" })}
              disabled={selection?.kind === "new"}
            >
              Nuevo asistente
            </Button>
          }
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col lg:overflow-y-auto">{detail}</div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`¿Eliminar a ${pendingDelete?.name ?? "este asistente"}?`}
        consequence="Dejará de responder y se borrarán también los documentos que consulta. No se puede deshacer; si solo quieres que deje de responder, ponlo en pausa."
        confirmLabel="Eliminar asistente"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={pendingSelection !== null}
        title="¿Descartar los cambios?"
        consequence="Tienes cambios sin guardar en este asistente. Si sigues, se pierden."
        confirmLabel="Descartar y seguir"
        destructive
        onConfirm={() => {
          setDirty(false);
          setSelection(pendingSelection);
          setPendingSelection(null);
        }}
        onClose={() => setPendingSelection(null)}
      />
    </div>
  );
}
