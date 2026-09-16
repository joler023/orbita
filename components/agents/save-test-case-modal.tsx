"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { TEST_CASE_NAME_MAX_LENGTH } from "@/lib/api/agent-test-bench";
import { useState } from "react";

export type SaveTestCaseModalProps = {
  open: boolean;
  onClose: () => void;
  /** Resolves when saved; rejects to keep the modal open with what was typed. */
  onSubmit: (name: string) => Promise<void>;
  validate: (name: string) => string | null;
};

export function SaveTestCaseModal({ open, onClose, onSubmit, validate }: SaveTestCaseModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setName("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    const problem = validate(name);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(name.trim());
      close();
    } catch {
      // The caller already told the owner why; keep what they typed so they can retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Guardar como caso de prueba" onClose={saving ? () => undefined : close}>
      <div className="flex flex-col gap-4">
        <Input
          name="test-case-name"
          label="¿Cómo lo llamas?"
          hint="Algo que reconozcas después. Por ejemplo: Domicilios fuera de la ciudad."
          value={name}
          maxLength={TEST_CASE_NAME_MAX_LENGTH}
          error={error ?? undefined}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={saving}>
            {saving ? "Guardando…" : "Guardar caso"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
