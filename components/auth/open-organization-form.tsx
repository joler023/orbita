"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUuid } from "@/lib/navigation";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Pulls the organization id out of a pasted dashboard link, or out of the bare id. */
export function readTenantId(value: string): string | null {
  const trimmed = value.trim();
  if (isUuid(trimmed)) {
    return trimmed;
  }
  return UUID_PATTERN.exec(trimmed)?.[0]?.toLowerCase() ?? null;
}

export function OpenOrganizationForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const tenantId = readTenantId(value);
    if (!tenantId) {
      setError("Ese enlace no parece de una organización de Órbita. Cópialo completo desde la barra del navegador.");
      return;
    }
    router.replace(`/t/${tenantId}/inicio`);
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 text-left">
      <Input
        name="organization"
        label="¿Tienes el enlace de tu organización?"
        hint="Pega aquí la dirección que usas para entrar, o el identificador."
        placeholder="http://localhost:3000/t/…"
        value={value}
        error={error ?? undefined}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
      />
      <Button type="submit" variant="secondary" size="sm" className="self-start" disabled={value.trim().length === 0}>
        Entrar
      </Button>
    </form>
  );
}
