import { CheckboxCard } from "@/components/ui/checkbox-card";
import type { AiTool } from "@/lib/api/ai-agents";

export type AgentToolsFieldsProps = {
  catalog: ReadonlyArray<AiTool>;
  selected: ReadonlyArray<string>;
  onChange: (tools: string[]) => void;
};

export function AgentToolsFields({ catalog, selected, onChange }: AgentToolsFieldsProps) {
  const toggle = (key: string, checked: boolean) => {
    const next = checked ? [...selected, key] : selected.filter((tool) => tool !== key);
    onChange(Array.from(new Set(next)));
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-foreground">¿Qué puede hacer por su cuenta?</legend>
      <p className="-mt-1 text-xs text-muted">
        Actívalas una por una. Tu asistente solo hará lo que marques aquí.
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        {catalog.map((tool) => (
          <CheckboxCard
            key={tool.key}
            title={tool.displayName}
            description={tool.description}
            disabledReason={tool.isAvailable ? undefined : (tool.unavailableReason ?? "Todavía no está disponible.")}
            checked={selected.includes(tool.key)}
            onCheckedChange={(checked) => toggle(tool.key, checked)}
          />
        ))}
      </div>
    </fieldset>
  );
}
