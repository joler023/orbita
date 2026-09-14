"use client";

import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type ScreenTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Fades each screen in when the route changes. The key is the path, so React remounts the
 * content and the animation runs again; without it the class would only play on first load.
 */
export function ScreenTransition({ children, className }: ScreenTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn("animate-screen-in", className)}>
      {children}
    </div>
  );
}
