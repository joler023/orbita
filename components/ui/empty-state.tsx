import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
      {icon ? <div className="text-orbita-400">{icon}</div> : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}
