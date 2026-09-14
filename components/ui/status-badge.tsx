import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
  icon?: ReactNode;
  className?: string;
};

const toneClass: Record<StatusTone, string> = {
  neutral: "border-neutral-border bg-neutral-bg text-neutral-fg",
  success: "border-success-border bg-success-bg text-success-fg",
  warning: "border-warning-border bg-warning-bg text-warning-fg",
  danger: "border-danger-border bg-danger-bg text-danger-fg",
  info: "border-info-border bg-info-bg text-info-fg",
};

export function StatusBadge({ tone, label, icon, className }: StatusBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-semibold whitespace-nowrap",
        toneClass[tone],
        className,
      )}
    >
      {icon ? (
        <span className="flex size-3.5 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {label}
    </span>
  );
}
