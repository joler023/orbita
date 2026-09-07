import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Radio } from "lucide-react";

export default function CanalesPage() {
  return (
    <ModulePlaceholder
      icon={Radio}
      title="Aún no hay canales conectados"
      description="Esta sección la está construyendo el equipo de canales. Conectar WhatsApp empieza ahí."
    />
  );
}
