"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PipelineKanban } from "@/components/crm/pipeline-kanban";
import {
  createPipeline,
  createStage,
  deletePipeline,
  deleteStage,
  listPipelines,
  reorderStages,
  updatePipeline,
  updateStage,
  type PipelineSummary,
  type StageSummary,
} from "@/lib/api/pipelines";
import {
  createOpportunity,
  getPipelineBoard,
  moveOpportunity,
  type OpportunityChangedEvent,
  type PipelineBoard,
} from "@/lib/api/opportunities";
import { listTeamMembers, type TeamMemberSummary } from "@/lib/api/team";
import { toUserMessage } from "@/lib/api/errors";
import { createCrmHubConnection, joinTenantGroup, subscribeToOpportunityChanges } from "@/lib/realtime/crm-hub";
import { Kanban, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function PipelineWorkspace({ tenantId }: { tenantId: string }) {
  const { notify } = useToast();
  const [pipelines, setPipelines] = useState<PipelineSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPipelineOpen, setNewPipelineOpen] = useState(false);
  const [newStageOpen, setNewStageOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageSummary | null>(null);
  const [deletingStage, setDeletingStage] = useState<StageSummary | null>(null);
  const [board, setBoard] = useState<PipelineBoard | null>(null);
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [fromFilter, setFromFilter] = useState("");
  const [toFilter, setToFilter] = useState("");
  const localEventIds = useRef(new Set<string>());

  const selected = pipelines.find((pipeline) => pipeline.id === selectedId) ?? pipelines[0] ?? null;

  const load = useCallback(async () => {
    const next = await listPipelines(tenantId);
    setPipelines(next);
    setSelectedId((current) => current ?? next.find((pipeline) => pipeline.isDefault)?.id ?? next[0]?.id ?? null);
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch((error: unknown) => {
        if (!cancelled) {
          notify(toUserMessage(error), "error");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load, notify]);

  const loadBoard = useCallback(async () => {
    if (!selectedId) {
      setBoard(null);
      return;
    }
    setBoard(
      await getPipelineBoard(tenantId, selectedId, {
        assignedToUserId: assigneeFilter || undefined,
        createdFrom: fromFilter ? new Date(fromFilter).toISOString() : undefined,
        createdTo: toFilter ? new Date(`${toFilter}T23:59:59`).toISOString() : undefined,
      }),
    );
  }, [assigneeFilter, fromFilter, selectedId, tenantId, toFilter]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    void loadBoard().catch((error: unknown) => notify(toUserMessage(error), "error"));
  }, [loadBoard, notify, selectedId]);

  useEffect(() => {
    void listTeamMembers(tenantId)
      .then((next) => setMembers(next.filter((member) => !member.isPending)))
      .catch(() => setMembers([]));
  }, [tenantId]);

  useEffect(() => {
    const connection = createCrmHubConnection();
    subscribeToOpportunityChanges(connection, (change) => {
      if (localEventIds.current.has(change.eventId)) {
        return;
      }
      setBoard((current) => (current ? applyRealtimeChange(current, change) : current));
    });
    void joinTenantGroup(connection, tenantId).catch(() => {
      // The board still works without live updates.
    });
    return () => {
      void connection.stop();
    };
  }, [tenantId]);

  function apply(next: PipelineSummary) {
    setPipelines((current) => {
      const exists = current.some((pipeline) => pipeline.id === next.id);
      const mapped = current.map((pipeline) => {
        if (pipeline.id === next.id) {
          return next;
        }
        return next.isDefault ? { ...pipeline, isDefault: false } : pipeline;
      });
      return exists ? mapped : [...mapped, next];
    });
    setSelectedId(next.id);
  }

  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  }

  async function handleMove(opportunityId: string, toStageId: string) {
    if (!selected || !board) {
      return;
    }
    const currentStage = board.stages.find((stage) =>
      stage.opportunities.some((card) => card.id === opportunityId),
    );
    if (!currentStage || currentStage.id === toStageId) {
      return;
    }

    const eventId = crypto.randomUUID();
    localEventIds.current.add(eventId);
    const previous = board;
    setBoard(moveCardLocally(board, opportunityId, toStageId));

    try {
      await moveOpportunity(tenantId, opportunityId, { stageId: toStageId, eventId });
    } catch (error) {
      setBoard(previous);
      localEventIds.current.delete(eventId);
      notify(toUserMessage(error), "error");
    }
  }

  async function handleCreate(stageId: string, title: string, amount: number | null) {
    if (!selected) {
      return;
    }
    await createOpportunity(tenantId, selected.id, { title, amount, stageId });
    await loadBoard();
    notify("Oportunidad creada.", "success");
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!selected) {
    return (
      <EmptyState
        icon={<Kanban className="size-8" />}
        title="Aún no hay pipeline"
        description="Crea el primer tablero para empezar a ordenar oportunidades."
        action={
          <Button onClick={() => setNewPipelineOpen(true)} leadingIcon={<Plus className="size-4" />}>
            Nuevo pipeline
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {pipelines.map((pipeline) => (
            <Button
              key={pipeline.id}
              size="sm"
              variant={pipeline.id === selected.id ? "primary" : "secondary"}
              onClick={() => setSelectedId(pipeline.id)}
            >
              {pipeline.name}
              {pipeline.isDefault ? " · predeterminado" : ""}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {!selected.isDefault ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                run(async () => {
                  apply(await updatePipeline(tenantId, selected.id, { isDefault: true }));
                  notify("Este pipeline es ahora el predeterminado.", "success");
                })
              }
            >
              Marcar predeterminado
            </Button>
          ) : null}
          {pipelines.length > 1 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                run(async () => {
                  await deletePipeline(tenantId, selected.id);
                  const next = pipelines.filter((pipeline) => pipeline.id !== selected.id);
                  setPipelines(next);
                  setSelectedId(next[0]?.id ?? null);
                  notify("Pipeline eliminado.", "success");
                })
              }
            >
              Eliminar pipeline
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => setNewPipelineOpen(true)}>
            Nuevo pipeline
          </Button>
          <Button size="sm" onClick={() => setNewStageOpen(true)} leadingIcon={<Plus className="size-4" />}>
            Nueva etapa
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-col gap-1.5 text-sm">
          <span className="font-medium">Responsable</span>
          <select
            className="h-11 rounded-xl border border-border bg-surface px-3"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="">Todos</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>
        <Input
          type="date"
          name="from"
          label="Desde"
          value={fromFilter}
          onChange={(event) => setFromFilter(event.target.value)}
        />
        <Input type="date" name="to" label="Hasta" value={toFilter} onChange={(event) => setToFilter(event.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {selected.stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-1 rounded-xl border border-border bg-surface px-2 py-1">
            <span className="text-xs font-medium">{stage.name}</span>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Mover ${stage.name} a la izquierda`}
              disabled={index === 0}
              onClick={() =>
                run(async () => {
                  const ids = selected.stages.map((item) => item.id);
                  [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                  apply(await reorderStages(tenantId, selected.id, ids));
                })
              }
            >
              ←
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Mover ${stage.name} a la derecha`}
              disabled={index === selected.stages.length - 1}
              onClick={() =>
                run(async () => {
                  const ids = selected.stages.map((item) => item.id);
                  [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                  apply(await reorderStages(tenantId, selected.id, ids));
                })
              }
            >
              →
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingStage(stage)}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDeletingStage(stage)}>
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      {board ? (
        <PipelineKanban
          board={board}
          onMove={(opportunityId, toStageId) => void handleMove(opportunityId, toStageId)}
          onCreate={(stageId, title, amount) => handleCreate(stageId, title, amount)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      )}

      <NameModal
        open={newPipelineOpen}
        title="Nuevo pipeline"
        confirmLabel="Crear pipeline"
        onClose={() => setNewPipelineOpen(false)}
        onSubmit={(name) =>
          run(async () => {
            apply(await createPipeline(tenantId, name));
            setNewPipelineOpen(false);
            notify("Pipeline creado.", "success");
          })
        }
      />
      <NameModal
        open={newStageOpen}
        title="Nueva etapa"
        confirmLabel="Crear etapa"
        onClose={() => setNewStageOpen(false)}
        onSubmit={(name) =>
          run(async () => {
            apply(await createStage(tenantId, selected.id, { name }));
            setNewStageOpen(false);
            notify("Etapa creada.", "success");
          })
        }
      />
      <EditStageModal
        stage={editingStage}
        onClose={() => setEditingStage(null)}
        onSubmit={(body) =>
          run(async () => {
            if (!editingStage) {
              return;
            }
            apply(await updateStage(tenantId, selected.id, editingStage.id, body));
            setEditingStage(null);
            notify("Etapa actualizada.", "success");
          })
        }
      />
      <DeleteStageModal
        stage={deletingStage}
        others={selected.stages.filter((stage) => stage.id !== deletingStage?.id)}
        onClose={() => setDeletingStage(null)}
        onSubmit={(relocateToStageId) =>
          run(async () => {
            if (!deletingStage) {
              return;
            }
            apply(await deleteStage(tenantId, selected.id, deletingStage.id, relocateToStageId));
            setDeletingStage(null);
            notify("Etapa eliminada.", "success");
          })
        }
      />
    </div>
  );
}

function NameModal({
  open,
  title,
  confirmLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(name);
          setName("");
        }}
      >
        <Input name="name" label="Nombre" value={name} onChange={(event) => setName(event.target.value)} required />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditStageModal({
  stage,
  onClose,
  onSubmit,
}: {
  stage: StageSummary | null;
  onClose: () => void;
  onSubmit: (body: { name: string; isWon: boolean; isLost: boolean }) => void;
}) {
  const [name, setName] = useState(stage?.name ?? "");
  const [outcome, setOutcome] = useState<"none" | "won" | "lost">(
    stage?.isWon ? "won" : stage?.isLost ? "lost" : "none",
  );

  useEffect(() => {
    setName(stage?.name ?? "");
    setOutcome(stage?.isWon ? "won" : stage?.isLost ? "lost" : "none");
  }, [stage]);

  return (
    <Modal open={stage !== null} title="Editar etapa" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ name, isWon: outcome === "won", isLost: outcome === "lost" });
        }}
      >
        <Input name="stage-name" label="Nombre" value={name} onChange={(event) => setName(event.target.value)} required />
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="font-medium">Resultado</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" checked={outcome === "none"} onChange={() => setOutcome("none")} />
            En curso
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" checked={outcome === "won"} onChange={() => setOutcome("won")} />
            Ganada
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="outcome" checked={outcome === "lost"} onChange={() => setOutcome("lost")} />
            Perdida
          </label>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteStageModal({
  stage,
  others,
  onClose,
  onSubmit,
}: {
  stage: StageSummary | null;
  others: StageSummary[];
  onClose: () => void;
  onSubmit: (relocateToStageId?: string) => void;
}) {
  const [relocateTo, setRelocateTo] = useState(others[0]?.id ?? "");

  useEffect(() => {
    setRelocateTo(others[0]?.id ?? "");
  }, [others, stage]);

  return (
    <Modal open={stage !== null} title="Eliminar etapa" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(relocateTo || undefined);
        }}
      >
        <p className="text-sm text-muted">
          Si esta etapa tiene oportunidades, muévelas a otra columna antes de borrarla.
        </p>
        {others.length > 0 ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Mover oportunidades a</span>
            <select
              className="h-11 rounded-xl border border-border bg-surface px-3"
              value={relocateTo}
              onChange={(event) => setRelocateTo(event.target.value)}
            >
              {others.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Eliminar</Button>
        </div>
      </form>
    </Modal>
  );
}

function moveCardLocally(board: PipelineBoard, opportunityId: string, toStageId: string): PipelineBoard {
  const card = board.stages.flatMap((stage) => stage.opportunities).find((item) => item.id === opportunityId);
  if (!card) {
    return board;
  }

  const moved = { ...card, stageId: toStageId };
  return {
    ...board,
    stages: board.stages.map((stage) => {
      const without = stage.opportunities.filter((item) => item.id !== opportunityId);
      const opportunities = stage.id === toStageId ? [moved, ...without] : without;
      return {
        ...stage,
        opportunities,
        amountSum: opportunities.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      };
    }),
  };
}

function applyRealtimeChange(board: PipelineBoard, change: OpportunityChangedEvent): PipelineBoard {
  const card = change.opportunity;
  if (card.pipelineId !== board.pipelineId) {
    return board;
  }

  return {
    ...board,
    stages: board.stages.map((stage) => {
      const without = stage.opportunities.filter((item) => item.id !== card.id);
      const opportunities = stage.id === card.stageId ? [card, ...without] : without;
      return {
        ...stage,
        opportunities,
        amountSum: opportunities.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      };
    }),
  };
}
