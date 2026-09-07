import { ModulePlaceholder } from "@/components/shell/module-placeholder";
import { CircleHelp } from "lucide-react";

export default function AyudaPage() {
  return (
    <ModulePlaceholder
      icon={CircleHelp}
      title="Ayuda"
      description="Pronto encontrarás guías cortas en español. Si algo no funciona, escríbele a quien te invitó a Órbita."
    />
  );
}
