import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import type { AiAgent } from "@/lib/api/ai-agents";
import { CheckCircle2, PauseCircle } from "lucide-react";
import type { ReactNode } from "react";
import { formatConversationCount } from "./agent-format";

export type AgentListProps = {
  agents: ReadonlyArray<AiAgent>;
  selectedId: string | null;
  onSelect: (agentId: string) => void;
  footer?: ReactNode;
};

export function AgentStatusBadge({ isEnabled }: { isEnabled: boolean }) {
  return isEnabled ? (
    <StatusBadge tone="success" label="Activo" icon={<CheckCircle2 className="size-3.5" />} />
  ) : (
    <StatusBadge tone="neutral" label="Pausado" icon={<PauseCircle className="size-3.5" />} />
  );
}

export function AgentList({ agents, selectedId, onSelect, footer }: AgentListProps) {
  return (
    <nav aria-label="Asistentes" className="flex flex-col gap-2">
      <p className="px-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Asistentes</p>
      <ul className="flex flex-col gap-2">
        {agents.map((agent) => {
          const selected = agent.id === selectedId;
          return (
            <li key={agent.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(agent.id)}
                className={cn(
                  "flex w-full flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500",
                  selected ? "border-orbita-600 bg-orbita-50" : "border-border bg-surface hover:bg-background",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{agent.name}</span>
                  <AgentStatusBadge isEnabled={agent.isEnabled} />
                </span>
                <span className="text-xs text-muted">{formatConversationCount(agent.conversationCount)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {footer}
    </nav>
  );
}
