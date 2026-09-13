import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AiAgent } from "@/lib/api/ai-agents";
import { Trash2 } from "lucide-react";
import { AgentStatusBadge } from "./agent-list";

export type AgentHeaderProps = {
  agent: AiAgent;
  toggling: boolean;
  onToggle: (isEnabled: boolean) => void;
  onDelete: () => void;
};

export function AgentHeader({ agent, toggling, onToggle, onDelete }: AgentHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-lg font-semibold text-foreground">{agent.name}</h2>
        <AgentStatusBadge isEnabled={agent.isEnabled} />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={agent.isEnabled}
          onCheckedChange={onToggle}
          disabled={toggling}
          label={agent.isEnabled ? "Responde a clientes" : "Pausado"}
          showLabel
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          leadingIcon={<Trash2 className="size-4" aria-hidden="true" />}
        >
          Eliminar
        </Button>
      </div>
    </header>
  );
}
