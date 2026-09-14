import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export type ErrorStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title,
  description,
  retryLabel = "Intentar de nuevo",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-danger-border bg-surface px-6 py-10 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
