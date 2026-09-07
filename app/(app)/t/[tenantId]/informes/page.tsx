import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { BarChart3 } from "lucide-react";

export default function InformesPage() {
  return (
    <ModulePlaceholder
      icon={BarChart3}
      title="Todavía no hay informes"
      description="Cuando haya conversaciones y oportunidades, aquí verás tiempos de respuesta, embudo y consumo."
    />
  );
}
