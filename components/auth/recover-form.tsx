"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api/auth";
import { toUserMessage } from "@/lib/api/errors";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setDone(true);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p>Si ese correo está en Órbita, te enviamos un enlace para cambiar la contraseña.</p>
        <Link className="font-medium text-orbita-600" href="/login">
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
      <Input
        name="email"
        type="email"
        autoComplete="email"
        label="Correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <Link className="text-sm font-medium text-orbita-600" href="/login">
        Volver a entrar
      </Link>
    </form>
  );
}
