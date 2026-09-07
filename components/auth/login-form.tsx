"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api/auth";
import { isTwoFactorRequired, toUserMessage } from "@/lib/api/errors";
import { readLastTenantId, writeSessionUser } from "@/lib/session/storage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const user = await login({
        email,
        password,
        twoFactorCode: needsTwoFactor ? twoFactorCode : null,
      });
      writeSessionUser(user);
      const next = searchParams.get("next");
      const tenantId = readLastTenantId();
      if (next?.startsWith("/t/")) {
        router.replace(next);
        return;
      }
      router.replace(tenantId ? `/t/${tenantId}/inicio` : "/sin-organizacion");
    } catch (cause) {
      if (isTwoFactorRequired(cause)) {
        setNeedsTwoFactor(true);
        setError(null);
      } else {
        setError(toUserMessage(cause));
      }
    } finally {
      setPending(false);
    }
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
      <Input
        name="password"
        type="password"
        autoComplete="current-password"
        label="Contraseña"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {needsTwoFactor ? (
        <Input
          name="twoFactorCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          label="Código de verificación"
          hint="Ábrelo en tu app de autenticación."
          value={twoFactorCode}
          onChange={(event) => setTwoFactorCode(event.target.value)}
          required
        />
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link className="font-medium text-orbita-600" href="/registro">
          Crear organización
        </Link>
      </p>
      <p className="text-sm text-muted">
        <Link className="font-medium text-orbita-600" href="/recuperar">
          Olvidé mi contraseña
        </Link>
      </p>
    </form>
  );
}
