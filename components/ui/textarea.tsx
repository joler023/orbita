import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({ id, label, hint, error, className, rows = 5, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <label htmlFor={textareaId} className="font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm leading-6 text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500",
          error ? "border-danger-fg" : "border-border",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
        }
        {...props}
      />
      {error ? (
        <span id={`${textareaId}-error`} className="text-xs text-danger-fg">
          {error}
        </span>
      ) : hint ? (
        <span id={`${textareaId}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
