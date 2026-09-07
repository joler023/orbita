import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Users } from "lucide-react";

export default function ContactosPage() {
  return (
    <ModulePlaceholder
      icon={Users}
      title="Todavía no hay contactos"
      description="El listado de contactos forma parte del CRM. Esta pantalla se llena en la siguiente historia de este track."
    />
  );
}
