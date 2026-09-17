import { cn } from "@/lib/cn";
import { useId } from "react";

export type RadioCardOption<T extends string> = {
  value: T;
  title: string;
  description?: string;
  /** Replaces the description and takes the option out of reach, like CheckboxCard does. */
  disabledReason?: string;
};

export type RadioCardGroupProps<T extends string> = {
  name: string;
  legend: string;
  options: ReadonlyArray<RadioCardOption<T>>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function RadioCardGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: RadioCardGroupProps<T>) {
  const groupId = useId();

  return (
    <fieldset className="flex flex-col gap-2 text-sm" disabled={disabled}>
      <legend className="mb-1.5 font-medium text-foreground">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = option.value === value;
          const unreachable = Boolean(option.disabledReason);
          const helper = option.disabledReason ?? option.description;
          const helperId = `${groupId}-${option.value}`;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-10 flex-col gap-1 rounded-lg border px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orbita-500",
                unreachable
                  ? "cursor-not-allowed border-border bg-background"
                  : "cursor-pointer bg-surface",
                selected && !unreachable
                  ? "border-orbita-600 bg-orbita-50"
                  : unreachable
                    ? null
                    : "border-border hover:bg-background",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-2 font-medium",
                  unreachable ? "text-muted" : "text-foreground",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected}
                  disabled={unreachable}
                  aria-describedby={helper ? helperId : undefined}
                  onChange={() => onChange(option.value)}
                  className="size-4 accent-orbita-600"
                />
                {option.title}
              </span>
              {helper ? (
                <span id={helperId} className="pl-6 text-xs text-muted">
                  {helper}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
