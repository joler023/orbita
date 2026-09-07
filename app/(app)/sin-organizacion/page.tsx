import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function NoOrganizationPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg items-center p-6">
      <EmptyState
        icon={<Building2 className="size-8" />}
        title="No encontramos tu organización en este dispositivo"
        description="El acceso todavía no lista las organizaciones de tu cuenta (eso lo resuelve el equipo de identidad). Si acabas de registrarte, crea la organización de nuevo en este navegador, o entra con el enlace que te compartieron."
        action={
          <Link
            href="/registro"
            className="inline-flex h-11 items-center rounded-xl bg-orbita-500 px-4 text-sm font-medium text-white"
          >
            Crear organización
          </Link>
        }
      />
    </div>
  );
}
