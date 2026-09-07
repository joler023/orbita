"use client";

import { cn } from "@/lib/cn";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ToastTone = "error" | "success" | "info";

export type ToastMessage = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-md",
              toast.tone === "error" && "bg-red-50 text-red-800",
              toast.tone === "success" && "bg-emerald-50 text-emerald-800",
              toast.tone === "info" && "bg-orbita-50 text-orbita-800",
            )}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
