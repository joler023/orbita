import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Megaphone } from "lucide-react";

export default function CampanasPage() {
  return (
    <ModulePlaceholder
      icon={Megaphone}
      title="Las campañas llegan más adelante"
      description="Desde aquí enviarás plantillas aprobadas a un grupo de contactos. Todavía no hay nada que programar."
    />
  );
}
