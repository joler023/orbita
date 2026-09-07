import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
};

export function Input({
  id,
  label,
  hint,
  error,
  leadingIcon,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5 text-sm">
      {label ? (
        <label htmlFor={inputId} className="font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <span className="relative flex items-center">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 text-muted">{leadingIcon}</span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500",
            leadingIcon ? "pl-10" : null,
            error ? "border-red-400" : "border-border",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </span>
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
