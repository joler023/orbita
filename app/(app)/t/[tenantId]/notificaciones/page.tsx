import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Bell } from "lucide-react";

export default function NotificacionesPage() {
  return (
    <ModulePlaceholder
      icon={Bell}
      title="Sin notificaciones todavía"
      description="Los avisos en vivo llegan con la bandeja. Por ahora no hay nada que revisar."
    />
  );
}
