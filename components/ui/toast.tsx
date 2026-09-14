"use client";

import { cn } from "@/lib/cn";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "error" | "success" | "info";

export type ToastMessage = {
  id: string;
  message: string;
  tone: ToastTone;
  leaving: boolean;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

/** How long a toast stays before it fades out. Errors stay until the person dismisses them. */
const VISIBLE_MS = 5_000;
const LEAVING_MS = 180;

const toneStyle: Record<ToastTone, { className: string; icon: ReactNode }> = {
  success: {
    className: "border-success-border bg-success-bg text-success-fg",
    icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
  },
  error: {
    className: "border-danger-border bg-danger-bg text-danger-fg",
    icon: <AlertTriangle className="size-4" aria-hidden="true" />,
  },
  info: {
    className: "border-info-border bg-info-bg text-info-fg",
    icon: <Info className="size-4" aria-hidden="true" />,
  },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, number>());

  const remove = useCallback((id: string) => {
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, LEAVING_MS);
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, tone, leaving: false }]);
      // An error is something to act on, so it waits for the person instead of vanishing.
      if (tone !== "error") {
        timers.current.set(id, window.setTimeout(() => remove(id), VISIBLE_MS));
      }
    },
    [remove],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      <div className="flex min-h-full flex-1 flex-col">{children}</div>
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg shadow-orbita-900/5",
              toast.leaving ? "animate-toast-out" : "animate-toast-in",
              toneStyle[toast.tone].className,
            )}
          >
            <span className="mt-0.5 shrink-0">{toneStyle[toast.tone].icon}</span>
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => remove(toast.id)}
              className="-mr-1 cursor-pointer rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
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
