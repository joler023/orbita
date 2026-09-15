import type { CurrentUser } from "@/lib/api/auth";
import { initialsFromName } from "@/lib/navigation";
import Link from "next/link";

/**
 * Read-only for now: there is no "update my name" or "change my password while signed
 * in" endpoint yet (only the forgot-password flow). Password change reuses that flow
 * instead of blocking on a new endpoint that isn't otherwise needed — see HANDOFF.md.
 */
export function ProfilePanel({ user }: { user: CurrentUser }) {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orbita-500 text-lg font-semibold text-white"
          aria-hidden="true"
        >
          {initialsFromName(user.fullName)}
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">{user.fullName}</p>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-foreground">Contraseña</h3>
        <p className="text-sm text-muted">
          Para cambiarla, te enviamos un enlace a tu correo — el mismo camino que usarías si la olvidaras.
        </p>
        <Link
          href="/recuperar"
          className="inline-flex h-9 w-fit items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-orbita-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
        >
          Cambiar mi contraseña
        </Link>
      </section>
    </div>
  );
}
