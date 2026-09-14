"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useState, type FormEvent } from "react";

export default function ContactoPage() {
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    notify(
      "Formulario borrador: Turnstile y el buzón real llegan después. Gracias por probar.",
      "success",
    );
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <p className="text-sm text-muted">Borrador · Contacto</p>
      <h1 className="text-3xl font-semibold text-orbita-900">Habla con nosotros</h1>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input name="name" label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          name="email"
          label="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Mensaje</span>
          <textarea
            name="message"
            className="min-h-28 rounded-xl border border-border bg-surface px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <Button type="submit">Enviar</Button>
      </form>
      <p className="text-xs text-muted">Sin Turnstile todavía. No se guarda nada en el servidor.</p>
    </div>
  );
}
