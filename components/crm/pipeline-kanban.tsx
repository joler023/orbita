"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  formatOpportunityAmount,
  type BoardStageSummary,
  type OpportunitySummary,
  type PipelineBoard,
} from "@/lib/api/opportunities";
import { Plus } from "lucide-react";
import { useState } from "react";

export function PipelineKanban({
  board,
  onMove,
  onCreate,
}: {
  board: PipelineBoard;
  onMove: (opportunityId: string, toStageId: string) => void;
  onCreate: (stageId: string, title: string, amount: number | null) => Promise<void>;
}) {
  const [createForStage, setCreateForStage] = useState<BoardStageSummary | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {board.stages.map((stage) => (
          <section
            key={stage.id}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-surface p-4 shadow-sm ${
              dragOverStageId === stage.id ? "border-orbita-500" : "border-border"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={() => setDragOverStageId((current) => (current === stage.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              setDragOverStageId(null);
              const opportunityId = event.dataTransfer.getData("text/opportunity-id");
              if (opportunityId) {
                onMove(opportunityId, stage.id);
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{stage.name}</h2>
                <p className="text-xs text-muted">{formatOpportunityAmount(stage.amountSum)}</p>
                {stage.isWon ? <p className="text-xs text-emerald-700">Ganada</p> : null}
                {stage.isLost ? <p className="text-xs text-red-700">Perdida</p> : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Nueva oportunidad en ${stage.name}`}
                onClick={() => setCreateForStage(stage)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <ul className="mt-4 flex min-h-32 flex-col gap-2">
              {stage.opportunities.map((card) => (
                <KanbanCard key={card.id} card={card} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <CreateOpportunityModal
        stage={createForStage}
        onClose={() => setCreateForStage(null)}
        onSubmit={async (title, amount) => {
          if (!createForStage) {
            return;
          }
          await onCreate(createForStage.id, title, amount);
          setCreateForStage(null);
        }}
      />
    </>
  );
}

function KanbanCard({ card }: { card: OpportunitySummary }) {
  return (
    <li>
      <article
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/opportunity-id", card.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        className="cursor-grab rounded-xl border border-border bg-background p-3 active:cursor-grabbing"
      >
        <h3 className="text-sm font-medium text-foreground">{card.title}</h3>
        <p className="mt-1 text-xs text-muted">{formatOpportunityAmount(card.amount)}</p>
        {card.assignedToName ? <p className="mt-1 text-xs text-muted">{card.assignedToName}</p> : null}
      </article>
    </li>
  );
}

function CreateOpportunityModal({
  stage,
  onClose,
  onSubmit,
}: {
  stage: BoardStageSummary | null;
  onClose: () => void;
  onSubmit: (title: string, amount: number | null) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <Modal open={stage !== null} title={stage ? `Nueva oportunidad · ${stage.name}` : "Nueva oportunidad"} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = amount.trim() === "" ? null : Number(amount);
          void onSubmit(title, Number.isFinite(parsed) ? parsed : null);
          setTitle("");
          setAmount("");
        }}
      >
        <Input name="title" label="Título" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <Input
          name="amount"
          label="Monto"
          type="number"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Crear</Button>
        </div>
      </form>
    </Modal>
  );
}
