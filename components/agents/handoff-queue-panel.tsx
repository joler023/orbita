"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { toUserMessage } from "@/lib/api/errors";
import {
  describeHandoffReason,
  HANDOFFS_POLL_INTERVAL_MS,
  isWaitingForSummary,
  listHandoffs,
  returnToAssistant,
  type Handoff,
} from "@/lib/api/handoffs";
import { usePolling } from "@/lib/hooks/use-polling";
import { CheckCircle2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type LoadState = "loading" | "ready" | "error";

export type HandoffQueuePanelProps = {
  tenantId: string;
  /** Viewers may read the queue but not hand a conversation back (the API answers 403). */
  canReturn: boolean;
};

/** Minutes and hours read better than a date for something that is waiting right now. */
export function formatWaitingSince(requestedAt: string, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(requestedAt).getTime()) / 60_000);
  if (minutes < 1) {
    return "Recién ahora";
  }
  if (minutes < 60) {
    return minutes === 1 ? "Hace 1 minuto" : `Hace ${minutes} minutos`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}

export function HandoffQueuePanel({ tenantId, canReturn }: HandoffQueuePanelProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<Handoff[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listHandoffs(tenantId)
      .then((page) => {
        if (!cancelled) {
          setItems(page.items);
          setCursor(page.nextCursor);
          setTotal(page.total);
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

  // The summary is written seconds after the handoff, so the first page refreshes until it is
  // there. Only the first page: pulling the rest would fight with whatever the person is reading.
  const refreshFirstPage = useCallback(async () => {
    try {
      const page = await listHandoffs(tenantId);
      setItems((current) =>
        current.map((handoff) => page.items.find((fresh) => fresh.conversationId === handoff.conversationId) ?? handoff),
      );
      setTotal(page.total);
    } catch {
      // A failed refresh leaves what is on screen: the summary can wait for the next tick.
    }
  }, [tenantId]);

  usePolling(refreshFirstPage, HANDOFFS_POLL_INTERVAL_MS, state === "ready" && isWaitingForSummary({ items }));

  const loadMore = async () => {
    if (!cursor) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await listHandoffs(tenantId, { cursor });
      setItems((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setTotal(page.total);
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handBack = async (handoff: Handoff) => {
    setReturningId(handoff.conversationId);
    try {
      await returnToAssistant(tenantId, handoff.conversationId);
      setItems((current) => current.filter((item) => item.conversationId !== handoff.conversationId));
      setTotal((current) => Math.max(current - 1, 0));
      notify("Tu asistente vuelve a atender esa conversación.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setReturningId(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando conversaciones en espera">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar las conversaciones en espera"
        description="Vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="size-8" aria-hidden="true" />}
        title="Nadie está esperando"
        description="Cuando tu asistente deje una conversación para tu equipo, aparece aquí con un resumen de lo que pasó."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Tu asistente dejó de responder estas conversaciones y están esperando a alguien de tu
        equipo. Mientras tanto, el cliente no recibe respuesta.
      </p>

      <ul aria-label="Conversaciones en espera" className="flex flex-col gap-3">
        {items.map((handoff) => {
          const reason = describeHandoffReason(handoff.reason);
          return (
            <li
              key={handoff.conversationId}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {handoff.contactName ?? "Contacto sin nombre"}
                  </span>
                  {reason ? <StatusBadge tone="warning" label={reason} /> : null}
                </span>
                <span className="text-xs text-muted">{formatWaitingSince(handoff.requestedAt)}</span>
              </div>

              {handoff.summary ? (
                <p className="text-sm text-foreground">{handoff.summary}</p>
              ) : (
                <p className="text-sm text-muted" aria-live="polite">
                  Preparando el resumen de la conversación…
                </p>
              )}

              {canReturn ? (
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={returningId !== null}
                    onClick={() => void handBack(handoff)}
                    leadingIcon={<Undo2 className="size-4" aria-hidden="true" />}
                  >
                    {returningId === handoff.conversationId
                      ? "Devolviendo…"
                      : "Que la retome el asistente"}
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-xs text-muted">
          {total === 1 ? "1 conversación esperando" : `${total} conversaciones esperando`}
          {items.length < total ? ` · mostrando ${items.length}` : null}
        </p>
        {cursor ? (
          <Button variant="secondary" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "Cargando…" : "Ver más"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
