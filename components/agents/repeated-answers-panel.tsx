"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { RadioCardGroup } from "@/components/ui/radio-card-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getSemanticCache,
  setSemanticCacheLevel,
  type SemanticCache,
  type SemanticCacheLevel,
} from "@/lib/api/ai-agents";
import { toUserMessage } from "@/lib/api/errors";
import { useEffect, useState } from "react";

const LEVEL_OPTIONS = [
  {
    value: "Off" as const,
    title: "Nunca",
    description: "Piensa cada respuesta desde cero.",
  },
  {
    value: "Conservative" as const,
    title: "Solo si es casi igual",
    description: "Reutiliza poco, se equivoca poco.",
  },
  {
    value: "Balanced" as const,
    title: "Si se parece bastante",
    description: "El punto medio.",
  },
  {
    value: "Aggressive" as const,
    title: "Si se parece",
    description: "Reutiliza mucho; cuida que no responda de más.",
  },
];

/** What the numbers mean for someone who never asked for a cache hit rate. */
export function describeReuse(cache: SemanticCache): string {
  const asked = cache.hits + cache.misses;
  if (cache.hitRate === null || asked === 0) {
    return "Todavía nadie le ha preguntado lo suficiente como para medirlo.";
  }
  const share = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 0 }).format(
    cache.hitRate,
  );
  const questions = asked === 1 ? "1 pregunta" : `${new Intl.NumberFormat("es-CO").format(asked)} preguntas`;
  const reused = cache.hits === 1 ? "1 se respondió" : `${cache.hits} se respondieron`;
  return `De ${questions}, ${reused} con una respuesta que ya tenía (${share}).`;
}

export type RepeatedAnswersPanelProps = {
  tenantId: string;
  agentId: string;
};

export function RepeatedAnswersPanel({ tenantId, agentId }: RepeatedAnswersPanelProps) {
  const { notify } = useToast();
  const [cache, setCache] = useState<SemanticCache | null>(null);
  const [level, setLevel] = useState<SemanticCacheLevel>("Off");
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getSemanticCache(tenantId, agentId)
      .then((result) => {
        if (!cancelled) {
          setCache(result);
          setLevel(result.level);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, agentId, reloadKey]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await setSemanticCacheLevel(tenantId, agentId, level);
      setCache(saved);
      setLevel(saved.level);
      notify(
        saved.level === "Off"
          ? "Listo. Tu asistente piensa cada respuesta desde cero."
          : "Listo. Tu asistente puede reutilizar respuestas parecidas.",
        "success",
      );
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  if (failed) {
    return (
      <ErrorState
        title="No pudimos cargar esta sección"
        description="Tu asistente sigue respondiendo igual. Vuelve a intentarlo en un momento."
        onRetry={() => {
          setFailed(false);
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  if (!cache) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando">
        <Skeleton className="h-24" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg border border-info-border bg-info-bg px-3 py-2 text-xs text-info-fg">
        Esto empieza a regir apenas lo guardes, sin esperar a que publiques.
      </p>

      <p className="text-sm text-muted">
        Cuando dos clientes preguntan casi lo mismo, tu asistente puede repetir la respuesta que
        ya dio en vez de pensarla otra vez. Contesta más rápido y te cuesta menos.
      </p>

      <RadioCardGroup
        name="reuse"
        legend="¿Cuándo puede repetir una respuesta?"
        options={LEVEL_OPTIONS}
        value={level}
        onChange={setLevel}
        disabled={saving}
      />

      <div className="rounded-lg border border-border bg-background px-3 py-2.5">
        <p className="text-sm text-foreground">{describeReuse(cache)}</p>
        <p className="mt-1 text-xs text-muted">
          Las respuestas guardadas se borran solas cuando cambias tus documentos o publicas
          instrucciones nuevas, así que no repite nada desactualizado.
        </p>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button size="sm" onClick={() => void save()} disabled={saving || level === cache.level}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
