import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Bot } from "lucide-react";

export default function AgentePage() {
  return (
    <ModulePlaceholder
      icon={Bot}
      title="El agente de IA se configura en otro track"
      description="Esta sección la está construyendo el equipo de agentes. Cuando esté lista, ajustarás a Aura desde aquí."
    />
  );
}
