"use client";

import type { Membership } from "@/lib/api/auth";
import { cn } from "@/lib/cn";
import { tenantPath } from "@/lib/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type OrgSwitcherProps = {
  tenantId: string;
  memberships: ReadonlyArray<Membership>;
  onNavigate?: () => void;
  className?: string;
};

/**
 * Lets someone who belongs to several organizations move between them. With a single
 * membership there is nothing to choose, so it renders the name as plain text instead of a
 * control that does nothing.
 */
export function OrgSwitcher({ tenantId, memberships, onNavigate, className }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = memberships.find((membership) => membership.tenantId === tenantId);
  const label = current?.name ?? "Tu organización";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (memberships.length < 2) {
    return <span className={cn("block truncate text-xs text-muted", className)}>{label}</span>;
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex w-full cursor-pointer items-center gap-1 rounded text-left text-xs text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronsUpDown className="size-3 shrink-0" aria-hidden="true" />
      </button>

      {open ? (
        <ul
          aria-label="Tus organizaciones"
          className="absolute bottom-full left-0 z-50 mb-1 max-h-64 w-full min-w-52 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {memberships.map((membership) => {
            const active = membership.tenantId === tenantId;
            return (
              <li key={membership.tenantId}>
                <Link
                  href={tenantPath(membership.tenantId, "inicio")}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm hover:bg-orbita-50/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-orbita-500",
                    active ? "font-medium text-foreground" : "text-muted",
                  )}
                >
                  <Check
                    className={cn("size-3.5 shrink-0", active ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{membership.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
