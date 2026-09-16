"use client";

import { ScreenTransition } from "@/components/ui/screen-transition";
import { ScrollArea } from "@/components/ui/scroll-area";
import { primaryNav } from "@/lib/navigation";
import { useCurrentUser } from "@/lib/session/current-user";
import { writeLastTenantId } from "@/lib/session/storage";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SidebarPanel } from "./sidebar-panel";
import { TopBar } from "./top-bar";

export function AppShell({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useCurrentUser();

  // Remembered as a preference only: the next sign-in lands here when the person still
  // belongs to it, and /api/auth/me stays the source of truth (see /sin-organizacion).
  useEffect(() => {
    writeLastTenantId(tenantId);
  }, [tenantId]);

  const current = primaryNav.find((item) => pathname.includes(`/${item.href}`));
  const title =
    current?.label ??
    (pathname.includes("/ajustes")
      ? "Ajustes"
      : pathname.includes("/ayuda")
        ? "Ayuda"
        : pathname.includes("/notificaciones")
          ? "Notificaciones"
          : "Órbita");


  return (
    // On a wide screen the frame fills the viewport and the content scrolls inside it, so
    // the sidebar and the header never slide away. Small screens keep the page scroll.
    <div className="min-h-full bg-background lg:h-dvh lg:overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border lg:block">
        <SidebarPanel
          tenantId={tenantId}
          pathname={pathname}
          user={user}
          memberships={user.memberships}
        />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-orbita-900/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-50 h-full w-72 shadow-xl">
            <SidebarPanel
              tenantId={tenantId}
              pathname={pathname}
              user={user}
              memberships={user.memberships}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-6 p-4 lg:ml-60 lg:h-dvh lg:p-6">
        <TopBar title={title} onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1 max-lg:overflow-visible">
            <ScreenTransition className="flex min-h-full flex-col">{children}</ScreenTransition>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
