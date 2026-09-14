import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import type { SessionUser } from "@/lib/session/storage";
import { SidebarNav } from "./sidebar-nav";
import { UserCard } from "./user-card";

export type SidebarPanelProps = {
  tenantId: string;
  pathname: string;
  user: SessionUser | null;
  organizationName?: string;
  onNavigate?: () => void;
};

export function SidebarPanel({
  tenantId,
  pathname,
  user,
  organizationName,
  onNavigate,
}: SidebarPanelProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 px-5 pt-6 pb-5">
        <Logo href={`/t/${tenantId}/inicio`} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <SidebarNav tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
      </div>
      <div className="flex shrink-0 flex-col gap-1 border-t border-sidebar-border px-3 py-3">
        <UserCard user={user} organizationName={organizationName} />
        <SignOutButton className="w-full justify-start" />
      </div>
    </div>
  );
}
