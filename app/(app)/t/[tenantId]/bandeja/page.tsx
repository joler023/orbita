import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { Inbox } from "lucide-react";

export default function BandejaPage() {
  return (
    <ModulePlaceholder
      icon={Inbox}
      title="La bandeja aún no está lista"
      description="Esta sección la está construyendo el equipo de canales. Cuando haya conversaciones, las atenderás desde aquí."
    />
  );
}
