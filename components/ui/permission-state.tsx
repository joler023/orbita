import { Lock } from "lucide-react";
import type { ReactNode } from "react";

export type PermissionStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PermissionState({ title, description, action }: PermissionStateProps) {
  return (
    <div
      role="status"
      className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface px-6 py-10 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-neutral-bg text-neutral-fg">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}
