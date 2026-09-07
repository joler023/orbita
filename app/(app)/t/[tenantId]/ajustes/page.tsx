import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Settings } from "lucide-react";

export default function AjustesPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Ajustes en construcción"
      description="El equipo, la facturación y la seguridad se configuran aquí cuando esas pantallas existan."
    />
  );
}
