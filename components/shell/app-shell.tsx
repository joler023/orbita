"use client";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getTenant, logout } from "@/lib/api/auth";
import { primaryNav } from "@/lib/navigation";
import { clearLocalSession, readSessionUser, type SessionUser } from "@/lib/session/storage";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { TopBar } from "./top-bar";
import { UserCard } from "./user-card";

export function AppShell({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | undefined>();
  const user = useMemo<SessionUser | null>(() => readSessionUser(), []);

  useEffect(() => {
    let cancelled = false;
    getTenant(tenantId)
      .then((tenant) => {
        if (!cancelled) {
          setOrganizationName(tenant.name);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrganizationName(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
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

  async function onLogout() {
    try {
      await logout();
    } catch {
      // Clearing local state still lets the person leave even if the API is down.
    }
    clearLocalSession();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full bg-background">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-[#ecebf5] bg-sidebar p-5 lg:flex">
        <Logo href={`/t/${tenantId}/inicio`} />
        <SidebarNav tenantId={tenantId} pathname={pathname} />
        <div className="mt-auto flex flex-col gap-2">
          <UserCard user={user} organizationName={organizationName} />
          <Button variant="ghost" size="sm" onClick={() => void onLogout()}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-orbita-900/40"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-60 flex-col gap-6 bg-sidebar p-5 shadow-xl">
            <Logo href={`/t/${tenantId}/inicio`} />
            <SidebarNav tenantId={tenantId} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto flex flex-col gap-2">
              <UserCard user={user} organizationName={organizationName} />
              <Button variant="ghost" size="sm" onClick={() => void onLogout()}>
                Cerrar sesión
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:p-6">
        <TopBar
          title={title}
          onOpenMenu={() => setMenuOpen(true)}
          compact={pathname.includes("/contactos")}
        />
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
