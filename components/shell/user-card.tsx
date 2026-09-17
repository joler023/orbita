import { initialsFromName } from "@/lib/navigation";
import type { CurrentUser } from "@/lib/api/auth";
import type { ReactNode } from "react";

export function UserCard({
  user,
  secondary,
}: {
  user: Pick<CurrentUser, "email" | "fullName"> | null;
  /** The line under the name. Falls back to the email when there is nothing better to show. */
  secondary?: ReactNode;
}) {
  const name = user?.fullName ?? "Cuenta";
  const email = user?.email ?? "";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-orbita-50/70 px-3 py-2">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orbita-500 text-xs font-semibold text-white"
        aria-hidden="true"
      >
        {initialsFromName(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        {secondary ?? <span className="block truncate text-xs text-muted">{email}</span>}
      </span>
    </div>
  );
}
