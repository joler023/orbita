import { SignOutButton } from "@/components/auth/sign-out-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function NoOrganizationPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg items-center p-6">
      <EmptyState
        icon={<Building2 className="size-8" />}
        title="Todavía no perteneces a ninguna organización"
        description="Crea la tuya para empezar a atender conversaciones, o pídele a quien te invitó que te reenvíe la invitación por correo."
        action={
          <div className="flex w-full max-w-sm flex-col items-center gap-3">
            <Link
              href="/registro"
              className="inline-flex h-11 items-center rounded-xl bg-orbita-500 px-4 text-sm font-medium text-white"
            >
              Crear organización
            </Link>
            <SignOutButton>Entrar con otra cuenta</SignOutButton>
          </div>
        }
      />
    </div>
  );
}
