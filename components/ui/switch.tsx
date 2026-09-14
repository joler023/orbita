import { cn } from "@/lib/cn";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  showLabel = false,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <label
      className={cn(
        "inline-flex min-h-10 items-center gap-2 text-sm text-foreground",
        disabled ? "cursor-not-allowed text-muted" : "cursor-pointer",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500 disabled:opacity-50",
          checked ? "bg-orbita-600" : "bg-neutral-border",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      {showLabel ? <span>{label}</span> : null}
    </label>
  );
}
