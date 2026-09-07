import { initialsFromName } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session/storage";

export function UserCard({
  user,
  organizationName,
}: {
  user: SessionUser | null;
  organizationName?: string;
}) {
  const name = user?.fullName ?? "Cuenta";
  const email = user?.email ?? "";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#ece6ff] text-sm font-bold text-nav-active"
        aria-hidden="true"
      >
        {initialsFromName(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted">{organizationName ?? email}</span>
      </span>
    </div>
  );
}
