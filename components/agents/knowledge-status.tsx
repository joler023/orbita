import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { KnowledgeDocStatus } from "@/lib/api/knowledge";
import { AlertTriangle, Check, Clock, Loader } from "lucide-react";
import type { ReactNode } from "react";

const statusCopy: Record<KnowledgeDocStatus, { label: string; tone: StatusTone; icon: ReactNode }> = {
  Pending: { label: "En cola", tone: "neutral", icon: <Clock className="size-3.5" /> },
  Processing: { label: "Indexando", tone: "warning", icon: <Loader className="size-3.5" /> },
  Indexed: { label: "Listo", tone: "success", icon: <Check className="size-3.5" /> },
  Failed: { label: "Error", tone: "danger", icon: <AlertTriangle className="size-3.5" /> },
};

export function KnowledgeStatusBadge({ status }: { status: KnowledgeDocStatus }) {
  const copy = statusCopy[status];
  return <StatusBadge tone={copy.tone} label={copy.label} icon={copy.icon} />;
}

export function formatKnowledgeMeta(chunkCount: number, status: KnowledgeDocStatus): string {
  if (status === "Indexed") {
    const fragments = new Intl.NumberFormat("es-CO").format(chunkCount);
    return chunkCount === 1 ? "1 fragmento" : `${fragments} fragmentos`;
  }
  if (status === "Processing") {
    return "Estamos leyéndolo…";
  }
  if (status === "Pending") {
    return "Esperando turno para leerse";
  }
  return "No se pudo usar";
}
