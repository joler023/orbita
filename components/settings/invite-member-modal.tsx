"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { MemberRole } from "@/lib/api/auth";
import { toUserMessage } from "@/lib/api/errors";
import { useId, useState } from "react";
import { ASSIGNABLE_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from "./role-labels";

export type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => Promise<void>;
};

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("Agent");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roleFieldId = useId();

  const reset = () => {
    setEmail("");
    setRole("Agent");
    setError(null);
  };

  const close = () => {
    if (pending) {
      return;
    }
    reset();
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onInvite(email, role);
      reset();
      onClose();
    } catch (invokeError) {
      setError(toUserMessage(invokeError));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} title="Invitar a tu equipo" onClose={close}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Input
          label="Correo"
          type="email"
          name="email"
          required
          autoFocus
          placeholder="persona@negocio.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="flex flex-col gap-1.5 text-sm">
          <label htmlFor={roleFieldId} className="font-medium text-foreground">
            Rol
          </label>
          <select
            id={roleFieldId}
            value={role}
            onChange={(event) => setRole(event.target.value as MemberRole)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orbita-500"
          >
            {ASSIGNABLE_ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABEL[option]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">{ROLE_DESCRIPTION[role]}</p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={pending || email.trim().length === 0}>
            {pending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
