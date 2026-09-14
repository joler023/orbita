"use client";

import { useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  consequence: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  consequence,
  confirmLabel,
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={pending ? () => undefined : onClose}>
      <p className="text-sm text-muted">{consequence}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          size="sm"
          onClick={confirm}
          disabled={pending}
          className={destructive ? "bg-danger-fg hover:bg-danger-fg/90" : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
