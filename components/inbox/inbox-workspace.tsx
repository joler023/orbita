"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import { IconInbox } from "@/components/icons/nav-icons";
import { Search } from "lucide-react";
import { useState } from "react";

type InboxFilter = "todas" | "mias" | "sin-responder" | "sin-asignar";

const FILTERS: Array<{ value: InboxFilter; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "mias", label: "Mías" },
  { value: "sin-responder", label: "Sin responder" },
  { value: "sin-asignar", label: "Sin asignar" },
];

/**
 * Guía de pantallas 1.8–1.10 — el esqueleto de la bandeja unificada. Solo la estructura
 * y los estados vacíos existen todavía: listar, filtrar, abrir una conversación y ver
 * los datos del contacto necesitan la bandeja unificada del backend (ORB-B12/B13/B14/
 * B15), que todavía no existe. `filter`/`search` ya quedan como el estado que una
 * futura llamada a la API recibiría como parámetros — nada aquí es de mentira, solo
 * está incompleto.
 */
export function InboxWorkspace({ tenantId }: { tenantId: string }) {
  // Reserved for the real list/search call once ORB-B12 exists — nothing to fetch yet.
  void tenantId;
  const [filter, setFilter] = useState<InboxFilter>("todas");
  const [search, setSearch] = useState("");

  return (
    <div className="grid min-h-0 items-stretch gap-4 lg:h-full lg:grid-cols-[320px_1fr]">
      <div className="flex min-h-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3 max-lg:min-h-[320px]">
        <Input
          aria-label="Buscar conversaciones"
          leadingIcon={<Search className="size-4" aria-hidden="true" />}
          placeholder="Buscar por nombre, teléfono o mensaje"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Tabs label="Filtrar conversaciones" items={FILTERS} value={filter} onChange={setFilter}>
          <ScrollArea className="flex flex-col gap-2">
            <EmptyState
              icon={<IconInbox className="size-8" aria-hidden="true" />}
              title="Aún no hay conversaciones"
              description="Cuando alguien te escriba por un canal conectado, aparecerá aquí para que la atiendas."
            />
          </ScrollArea>
        </Tabs>
      </div>
      <ScrollArea className="flex min-w-0 flex-col rounded-xl border border-border bg-surface max-lg:hidden">
        <EmptyState
          icon={<IconInbox className="size-8" aria-hidden="true" />}
          title="Elige una conversación"
          description="Selecciona una conversación de la lista para leerla y responder."
        />
      </ScrollArea>
    </div>
  );
}
