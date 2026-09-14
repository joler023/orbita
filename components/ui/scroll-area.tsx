import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type ScrollOrientation = "vertical" | "horizontal";

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: ScrollOrientation;
  /** Names the region so it can be reached and announced on its own. */
  label?: string;
  /**
   * Makes the box itself a keyboard stop. Needed only when nothing inside it can take
   * focus — otherwise the inner controls already scroll it, and a stop here just adds a
   * tab press before every list.
   */
  focusable?: boolean;
};

const orientationClass: Record<ScrollOrientation, string> = {
  vertical: "overflow-y-auto overflow-x-hidden",
  horizontal: "overflow-x-auto overflow-y-hidden",
};

export function ScrollArea({
  orientation = "vertical",
  label,
  focusable = false,
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      tabIndex={focusable ? 0 : undefined}
      role={label ? "region" : undefined}
      aria-label={label}
      className={cn(
        "min-h-0 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500",
        orientationClass[orientation],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
