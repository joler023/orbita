"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  createAiAgent,
  listAiTools,
  toSaveRequest,
  updateAiAgent,
  type AiAgent,
  type AiTool,
  type SaveAiAgentRequest,
} from "@/lib/api/ai-agents";
import { toUserMessage } from "@/lib/api/errors";
import { useEffect, useState } from "react";
import {
  emptyAgentDraft,
  hasDraftErrors,
  isSameDraft,
  normalizeDraft,
  validateAgentDraft,
  type AgentDraftErrors,
} from "./agent-draft";
import { AgentInstructionsFields } from "./agent-instructions-fields";
import { AgentToolsFields } from "./agent-tools-fields";

type EditorTab = "instructions" | "tools";

const EDITOR_TABS: ReadonlyArray<{ value: EditorTab; label: string }> = [
  { value: "instructions", label: "Instrucciones" },
  { value: "tools", label: "Herramientas" },
];

type CatalogState = { status: "loading" } | { status: "ready"; tools: AiTool[] } | { status: "error" };

export type AgentEditorProps = {
  tenantId: string;
  agent: AiAgent | null;
  onSaved: (agent: AiAgent) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCancelCreate?: () => void;
};

export function AgentEditor({ tenantId, agent, onSaved, onDirtyChange, onCancelCreate }: AgentEditorProps) {
  const { notify } = useToast();
  const [baseline, setBaseline] = useState<SaveAiAgentRequest>(() =>
    agent ? toSaveRequest(agent) : emptyAgentDraft(),
  );
  const [draft, setDraft] = useState<SaveAiAgentRequest>(baseline);
  const [errors, setErrors] = useState<AgentDraftErrors>({});
  const [tab, setTab] = useState<EditorTab>("instructions");
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [catalogKey, setCatalogKey] = useState(0);

  const dirty = !isSameDraft(draft, baseline);
  const creating = agent === null;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    let cancelled = false;
    listAiTools()
      .then((tools) => {
        if (!cancelled) {
          setCatalog({ status: "ready", tools });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog({ status: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalogKey]);

  const change = (patch: Partial<SaveAiAgentRequest>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch)) {
        delete next[field as keyof AgentDraftErrors];
      }
      return next;
    });
  };

  const save = async () => {
    const validation = validateAgentDraft(draft);
    if (hasDraftErrors(validation)) {
      setErrors(validation);
      setTab("instructions");
      return;
    }
    const request = normalizeDraft(draft);
    setSaving(true);
    try {
      const saved = creating
        ? await createAiAgent(tenantId, request)
        : await updateAiAgent(tenantId, agent.id, request);
      const savedDraft = toSaveRequest(saved);
      setBaseline(savedDraft);
      setDraft(savedDraft);
      notify(creating ? `Creaste a ${saved.name}. Queda en pausa hasta que lo actives.` : "Guardamos los cambios.", "success");
      onSaved(saved);
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs label="Secciones del asistente" items={EDITOR_TABS} value={tab} onChange={setTab}>
        {tab === "instructions" ? (
          <AgentInstructionsFields draft={draft} errors={errors} onChange={change} />
        ) : catalog.status === "loading" ? (
          <div className="grid gap-2 md:grid-cols-2" aria-busy="true" aria-label="Cargando herramientas">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : catalog.status === "error" ? (
          <ErrorState
            title="No pudimos cargar las herramientas"
            description="Tus instrucciones siguen aquí. Vuelve a intentarlo en un momento."
            onRetry={() => {
              setCatalog({ status: "loading" });
              setCatalogKey((key) => key + 1);
            }}
          />
        ) : (
          <AgentToolsFields
            catalog={catalog.tools}
            selected={draft.tools}
            onChange={(tools) => change({ tools })}
          />
        )}
      </Tabs>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {dirty && !creating ? <p className="mr-auto text-xs text-muted">Tienes cambios sin guardar.</p> : null}
        {creating && onCancelCreate ? (
          <Button variant="secondary" size="sm" onClick={onCancelCreate} disabled={saving}>
            Cancelar
          </Button>
        ) : null}
        {dirty && !creating ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => {
              setDraft(baseline);
              setErrors({});
            }}
          >
            Descartar
          </Button>
        ) : null}
        <Button size="sm" onClick={() => void save()} disabled={saving || (!dirty && !creating)}>
          {saving ? "Guardando…" : creating ? "Crear asistente" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
