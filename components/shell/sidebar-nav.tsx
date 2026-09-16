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
    <nav className="flex flex-1 flex-col" aria-label="Principal">
      <NavGroup items={primaryNav} tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
      <div className="mt-auto pt-6">
        <NavGroup items={secondaryNav} tenantId={tenantId} pathname={pathname} onNavigate={onNavigate} />
      </div>
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
                "flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-base font-medium transition-colors",
                active
                  ? "bg-orbita-50 text-nav-active"
                  : "text-muted hover:bg-white/70 hover:text-foreground",
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
