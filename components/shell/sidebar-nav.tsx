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
      <NavGroup
        items={secondaryNav}
        tenantId={tenantId}
        pathname={pathname}
        onNavigate={onNavigate}
        className="mt-auto"
      />
    </nav>
  );
}

function NavGroup({
  items,
  tenantId,
  pathname,
  onNavigate,
  className,
}: {
  items: NavItem[];
  tenantId: string;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
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
                "flex h-9 items-center gap-[11px] rounded-lg px-3.5 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500",
                active
                  ? "bg-orbita-50 font-medium text-nav-active"
                  : "text-nav-muted hover:bg-orbita-50/60 hover:text-foreground",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
