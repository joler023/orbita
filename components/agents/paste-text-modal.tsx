"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { KNOWLEDGE_TEXT_MAX_LENGTH, KNOWLEDGE_TEXT_TITLE_MAX_LENGTH } from "@/lib/api/knowledge";
import { useState } from "react";

export type PasteTextModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: { title: string; text: string }) => Promise<void>;
};

export function PasteTextModal({ open, onClose, onSubmit }: PasteTextModalProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ title?: string; text?: string }>({});
  const [saving, setSaving] = useState(false);

  const close = () => {
    setTitle("");
    setText("");
    setErrors({});
    onClose();
  };

  const submit = async () => {
    const nextErrors: { title?: string; text?: string } = {};
    if (title.trim().length === 0) {
      nextErrors.title = "Ponle un nombre para reconocerlo después.";
    }
    if (text.trim().length === 0) {
      nextErrors.text = "Pega aquí lo que quieres que tu asistente sepa.";
    }
    if (nextErrors.title || nextErrors.text) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), text: text.trim() });
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Pegar texto" onClose={saving ? () => undefined : close}>
      <div className="flex flex-col gap-4">
        <Input
          name="knowledge-title"
          label="¿Qué es este texto?"
          hint="Por ejemplo: Horarios, Precios de septiembre."
          value={title}
          maxLength={KNOWLEDGE_TEXT_TITLE_MAX_LENGTH}
          error={errors.title}
          onChange={(event) => {
            setTitle(event.target.value);
            setErrors((current) => ({ ...current, title: undefined }));
          }}
        />
        <Textarea
          name="knowledge-text"
          label="Texto"
          rows={8}
          value={text}
          maxLength={KNOWLEDGE_TEXT_MAX_LENGTH}
          error={errors.text}
          onChange={(event) => {
            setText(event.target.value);
            setErrors((current) => ({ ...current, text: undefined }));
          }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
