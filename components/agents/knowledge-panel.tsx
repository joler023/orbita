"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { FileDrop } from "@/components/ui/file-drop";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { toUserMessage } from "@/lib/api/errors";
import {
  addKnowledgeText,
  deleteKnowledgeDocument,
  isIndexingInProgress,
  KNOWLEDGE_ACCEPTED_EXTENSIONS,
  KNOWLEDGE_MAX_UPLOAD_BYTES,
  KNOWLEDGE_POLL_INTERVAL_MS,
  listKnowledgeDocuments,
  reindexKnowledgeDocument,
  uploadKnowledgeDocument,
  type KnowledgeDocument,
} from "@/lib/api/knowledge";
import { usePolling } from "@/lib/hooks/use-polling";
import { FileText, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatKnowledgeMeta, KnowledgeStatusBadge } from "./knowledge-status";
import { PasteTextModal } from "./paste-text-modal";

type LoadState = "loading" | "ready" | "error";

export type KnowledgePanelProps = {
  tenantId: string;
  agentId: string;
};

export function KnowledgePanel({ tenantId, agentId }: KnowledgePanelProps) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<KnowledgeDocument | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listKnowledgeDocuments(tenantId, agentId)
      .then((page) => {
        if (!cancelled) {
          setDocuments(page.items);
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
  }, [tenantId, agentId, reloadKey]);

  const refresh = useCallback(async () => {
    const page = await listKnowledgeDocuments(tenantId, agentId);
    setDocuments(page.items);
  }, [tenantId, agentId]);

  // The indexer works in the background, so the list polls itself until nothing is left in flight.
  usePolling(refresh, KNOWLEDGE_POLL_INTERVAL_MS, state === "ready" && isIndexingInProgress(documents));

  const addDocument = (document: KnowledgeDocument) => {
    setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        addDocument(await uploadKnowledgeDocument(tenantId, agentId, file));
      }
      notify(
        files.length === 1
          ? "Subimos el documento. Te avisamos aquí cuando esté listo."
          : "Subimos los documentos. Te avisamos aquí cuando estén listos.",
        "success",
      );
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setUploading(false);
    }
  };

  const pasteText = async (body: { title: string; text: string }) => {
    try {
      addDocument(await addKnowledgeText(tenantId, agentId, body));
      notify("Guardamos el texto. Te avisamos aquí cuando esté listo.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  };

  const reindex = async (document: KnowledgeDocument) => {
    try {
      addDocument(await reindexKnowledgeDocument(tenantId, agentId, document.id));
      notify(`Estamos volviendo a leer «${document.title}».`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteKnowledgeDocument(tenantId, agentId, pendingDelete.id);
      setDocuments((current) => current.filter((item) => item.id !== pendingDelete.id));
      notify(`Eliminaste «${pendingDelete.title}».`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPendingDelete(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando documentos">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar los documentos"
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Tu asistente responde con lo que haya aquí: catálogo, precios o preguntas frecuentes.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setPasteOpen(true)}>
          Pegar texto
        </Button>
      </div>

      {documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <FileText className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{document.title}</span>
                <span className="text-xs text-muted">
                  {document.failureReason ?? formatKnowledgeMeta(document.chunkCount, document.status)}
                </span>
              </span>
              <KnowledgeStatusBadge status={document.status} />
              <span className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Volver a leer ${document.title}`}
                  onClick={() => void reindex(document)}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar ${document.title}`}
                  onClick={() => setPendingDelete(document)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <FileDrop
        label={uploading ? "Subiendo…" : "Arrastra archivos o elige uno"}
        hint="PDF, DOCX, TXT o MD. Hasta 25 MB cada uno."
        accept={KNOWLEDGE_ACCEPTED_EXTENSIONS}
        maxBytes={KNOWLEDGE_MAX_UPLOAD_BYTES}
        disabled={uploading}
        onFiles={(files) => void upload(files)}
        onReject={(message) => notify(message, "error")}
      />

      <PasteTextModal open={pasteOpen} onClose={() => setPasteOpen(false)} onSubmit={pasteText} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`¿Eliminar «${pendingDelete?.title ?? ""}»?`}
        consequence="Tu asistente dejará de usarlo para responder. No se puede deshacer, pero puedes volver a subirlo."
        confirmLabel="Eliminar documento"
        destructive
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
