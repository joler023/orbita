import { cn } from "@/lib/cn";
import { useId } from "react";

export type LevelSliderProps<T extends string> = {
  levels: readonly [T, T, T];
  value: T;
  onChange: (value: T) => void;
  startLabel: string;
  endLabel: string;
  /** Read out by screen readers in place of the raw level name. */
  levelLabels: readonly [string, string, string];
  disabled?: boolean;
};

export function LevelSlider<T extends string>({
  levels,
  value,
  onChange,
  startLabel,
  endLabel,
  levelLabels,
  disabled = false,
}: LevelSliderProps<T>) {
  const labelId = useId();
  const index = Math.max(0, levels.indexOf(value));

  return (
    <div className="flex items-center gap-3 text-sm">
      <span id={labelId} className="w-20 shrink-0 text-muted">
        {startLabel}
      </span>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={index}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-valuetext={levelLabels[index]}
        onChange={(event) => onChange(levels[Number(event.target.value)] ?? value)}
        className={cn(
          "h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-orbita-100 accent-orbita-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orbita-500",
          disabled ? "cursor-not-allowed opacity-60" : null,
        )}
      />
      <span className="w-20 shrink-0 text-right text-muted">{endLabel}</span>
    </div>
  );
}
