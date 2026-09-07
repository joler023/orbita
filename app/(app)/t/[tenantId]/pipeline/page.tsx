import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Kanban } from "lucide-react";

export default function PipelinePage() {
  return (
    <ModulePlaceholder
      icon={Kanban}
      title="El pipeline llega después"
      description="Aquí verás el tablero de oportunidades. Aún no hay etapas ni tarjetas que mover."
    />
  );
}
