import { cn } from "@/lib/cn";

export type RadioCardOption<T extends string> = {
  value: T;
  title: string;
  description?: string;
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
  return (
    <fieldset className="flex flex-col gap-2 text-sm" disabled={disabled}>
      <legend className="mb-1.5 font-medium text-foreground">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-10 cursor-pointer flex-col gap-1 rounded-lg border bg-surface px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orbita-500 has-[:disabled]:cursor-not-allowed",
                selected ? "border-orbita-600 bg-orbita-50" : "border-border hover:bg-background",
              )}
            >
              <span className="flex items-center gap-2 font-medium text-foreground">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                  className="size-4 accent-orbita-600"
                />
                {option.title}
              </span>
              {option.description ? (
                <span className="pl-6 text-xs text-muted">{option.description}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
