import { cn } from "@/lib/cn";
import { isActivePath, primaryNav, secondaryNav, tenantPath, type NavItem } from "@/lib/navigation";
import Link from "next/link";

export function SidebarNav({
  tenantId,
  pathname,
  onNavigate,
}: {
  tenantId: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Principal">
      <NavGroup items={primaryNav} tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
      <NavGroup items={secondaryNav} tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
    </nav>
  );
}

function NavGroup({
  items,
  tenantId,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  tenantId: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(pathname, tenantId, item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={tenantPath(tenantId, item.href)}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-orbita-50 text-orbita-700"
                  : "text-muted hover:bg-orbita-50/70 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", active ? "text-orbita-500" : "text-muted")} aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
