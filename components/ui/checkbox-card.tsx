import { cn } from "@/lib/cn";
import { useId } from "react";

export type CheckboxCardProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description?: string;
  disabledReason?: string;
  disabled?: boolean;
};

export function CheckboxCard({
  checked,
  onCheckedChange,
  title,
  description,
  disabledReason,
  disabled = false,
}: CheckboxCardProps) {
  const descriptionId = useId();
  const isDisabled = disabled || Boolean(disabledReason);
  const helper = disabledReason ?? description;

  return (
    <label
      className={cn(
        "flex min-h-10 gap-3 rounded-lg border px-3 py-2.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orbita-500",
        isDisabled
          ? "cursor-not-allowed border-border bg-background"
          : "cursor-pointer border-border bg-surface hover:bg-background",
        checked && !isDisabled ? "border-orbita-600" : null,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={isDisabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        aria-describedby={helper ? descriptionId : undefined}
        className="mt-0.5 size-4 shrink-0 accent-orbita-600"
      />
      <span className="flex flex-col gap-0.5">
        <span className={cn("font-medium", isDisabled ? "text-muted" : "text-foreground")}>
          {title}
        </span>
        {helper ? (
          <span id={descriptionId} className="text-xs text-muted">
            {helper}
          </span>
        ) : null}
      </span>
    </label>
  );
}
