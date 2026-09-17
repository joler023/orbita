import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CurrentUser, Membership } from "@/lib/api/auth";
import { OrgSwitcher } from "./org-switcher";
import { SidebarNav } from "./sidebar-nav";
import { UserCard } from "./user-card";

export type SidebarPanelProps = {
  tenantId: string;
  pathname: string;
  user: Pick<CurrentUser, "email" | "fullName"> | null;
  memberships: ReadonlyArray<Membership>;
  onNavigate?: () => void;
};

export function SidebarPanel({
  tenantId,
  pathname,
  user,
  memberships,
  onNavigate,
}: SidebarPanelProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 px-5 pt-6 pb-5">
        <Logo href={`/t/${tenantId}/inicio`} />
      </div>
      <ScrollArea className="flex-1 px-5 pb-4">
        <SidebarNav tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
      </ScrollArea>
      <div className="flex shrink-0 flex-col gap-1 border-t border-sidebar-border px-3 py-3">
        <UserCard
          user={user}
          secondary={
            <OrgSwitcher tenantId={tenantId} memberships={memberships} onNavigate={onNavigate} />
          }
        />
        <SignOutButton className="w-full justify-start" />
      </div>
    </div>
  );
}
