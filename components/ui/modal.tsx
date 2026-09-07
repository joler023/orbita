"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./button";

export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-orbita-900/40"
        aria-label="Cerrar diálogo"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbita-modal-title"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl bg-surface p-5 shadow-lg",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="orbita-modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" aria-label="Cerrar" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
