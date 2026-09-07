"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, registerOrganization } from "@/lib/api/auth";
import { toUserMessage } from "@/lib/api/errors";
import { writeLastTenantId, writeSessionUser } from "@/lib/session/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const organization = await registerOrganization({
        businessName,
        fullName,
        email,
        password,
      });
      const user = await login({ email, password });
      writeSessionUser(user);
      writeLastTenantId(organization.tenantId);
      router.replace(`/t/${organization.tenantId}/inicio`);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
      <Input
        name="businessName"
        label="Nombre del negocio"
        value={businessName}
        onChange={(event) => setBusinessName(event.target.value)}
        required
        maxLength={200}
      />
      <Input
        name="fullName"
        label="Tu nombre"
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
        maxLength={200}
      />
      <Input
        name="email"
        type="email"
        autoComplete="email"
        label="Correo"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        name="password"
        type="password"
        autoComplete="new-password"
        label="Contraseña"
        hint="Mínimo 8 caracteres."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={8}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear organización"}
      </Button>
      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-medium text-orbita-600" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
