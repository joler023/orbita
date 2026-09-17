"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";

export type TagFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  /** Once reached, the field stops accepting new entries instead of failing on submit. */
  maxTags?: number;
  /** Enforced while typing, so an entry can never be created over the limit. */
  maxTagLength?: number;
  disabled?: boolean;
  removeLabel?: (tag: string) => string;
  className?: string;
};

function defaultRemoveLabel(tag: string): string {
  return `Quitar ${tag}`;
}

/**
 * Free-text entries shown as removable chips. Entries are compared without case so the
 * same word cannot be added twice, and what the person typed is what gets stored — this
 * field never rewrites an entry.
 */
export function TagField({
  value,
  onChange,
  id,
  label,
  hint,
  error,
  placeholder,
  maxTags,
  maxTagLength,
  disabled = false,
  removeLabel = defaultRemoveLabel,
  className,
}: TagFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [draft, setDraft] = useState("");

  const isFull = maxTags !== undefined && value.length >= maxTags;
  const inputDisabled = disabled || isFull;

  const commit = () => {
    const entry = draft.trim();
    if (entry.length === 0) {
      setDraft("");
      return;
    }
    const alreadyThere = value.some((tag) => tag.toLocaleLowerCase() === entry.toLocaleLowerCase());
    if (!alreadyThere) {
      onChange([...value, entry]);
    }
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, position) => position !== index));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }
    if (event.key === "Backspace" && draft.length === 0 && value.length > 0) {
      event.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5 text-sm", className)}>
      {label ? (
        <label htmlFor={fieldId} className="font-medium text-foreground">
          {label}
        </label>
      ) : null}

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <li
              key={tag}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-border bg-neutral-bg pr-1 pl-2 text-xs font-medium text-foreground"
            >
              <span className="max-w-60 truncate">{tag}</span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={removeLabel(tag)}
                className="flex size-5 cursor-pointer items-center justify-center rounded text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orbita-500 disabled:cursor-not-allowed"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id={fieldId}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        disabled={inputDisabled}
        maxLength={maxTagLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:cursor-not-allowed disabled:bg-neutral-bg",
          error ? "border-danger-border" : "border-border",
        )}
      />

      {error ? (
        <span id={`${fieldId}-error`} className="text-xs text-danger-fg">
          {error}
        </span>
      ) : hint ? (
        <span id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </span>
      ) : null}

      {maxTags !== undefined ? (
        <span className="text-xs text-muted" aria-live="polite">
          {value.length} de {maxTags}
        </span>
      ) : null}
    </div>
  );
}
