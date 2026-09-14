"use client";

import { useEffect, useRef } from "react";

export function usePolling(callback: () => Promise<void>, intervalMs: number, enabled: boolean): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    const schedule = () => {
      timeoutId = window.setTimeout(tick, intervalMs);
    };

    // Chained timeouts instead of setInterval so a slow request never overlaps the next one.
    const tick = async () => {
      if (cancelled) {
        return;
      }
      if (document.visibilityState !== "hidden") {
        try {
          await callbackRef.current();
        } catch {
          // The callback owns its error reporting; polling just keeps going.
        }
      }
      if (!cancelled) {
        schedule();
      }
    };

    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs]);
}
