"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  createContact,
  formatContactChannel,
  formatRelativeActivity,
  searchContacts,
  stageTone,
  type ContactListItem,
} from "@/lib/api/contacts";
import { formatOpportunityAmount } from "@/lib/api/opportunities";
import { toUserMessage } from "@/lib/api/errors";
import { initialsFromName, tenantPath } from "@/lib/navigation";
import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const COLUMNS = [
  { key: "name", header: "Contacto" },
  { key: "channel", header: "Canal" },
  { key: "stage", header: "Etapa" },
  { key: "activity", header: "Última actividad" },
  { key: "amount", header: "Valor" },
  { key: "owner", header: "Responsable" },
];

export function ContactsWorkspace({ tenantId }: { tenantId: string }) {
  const { notify } = useToast();
  const [rows, setRows] = useState<ContactListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<"all" | "no-deal">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [newChannel, setNewChannel] = useState("whatsapp");

  const load = useCallback(async () => {
    const next = await searchContacts(tenantId, {
      q: query.trim() || undefined,
    });
    setRows(next);
  }, [query, tenantId]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setLoading(true);
      load()
        .catch((error: unknown) => {
          if (!cancelled) {
            notify(toUserMessage(error), "error");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [load, notify]);

  async function handleCreate() {
    try {
      await createContact(tenantId, {
        displayName,
        phone: phone || null,
        instagramUsername: instagram || null,
        email: email || null,
        channel: newChannel,
      });
      setCreateOpen(false);
      setDisplayName("");
      setPhone("");
      setInstagram("");
      setEmail("");
      setNewChannel("whatsapp");
      await load();
      notify("Contacto creado.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  }

  const visible = chip === "no-deal" ? rows.filter((row) => !row.stageName) : rows;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">{rows.length.toLocaleString("es-CO")} registros</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => notify("Importar contactos llega en una historia siguiente.", "success")}
          >
            Importar
          </Button>
          <Button leadingIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
            Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-xs">
            <Input
              name="contact-search"
              placeholder="Buscar por nombre o teléfono"
              aria-label="Buscar contactos"
              hint="Borrador: también encuentra nombres incompletos o con errores."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leadingIcon={<Search className="size-4" />}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <FilterChip active={chip === "all"} onClick={() => setChip("all")}>
              Todos {rows.length.toLocaleString("es-CO")}
            </FilterChip>
            <FilterChip active={chip === "no-deal"} onClick={() => setChip("no-deal")}>
              Sin oportunidad
            </FilterChip>
            <FilterChip
              onClick={() => notify("Los segmentos llegan cuando existan etiquetas de contacto.", "success")}
            >
              Mayoristas
            </FilterChip>
            <FilterChip
              onClick={() => notify("Más filtros llegan con la búsqueda avanzada.", "success")}
            >
              + Filtro
            </FilterChip>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => notify("Exportar contactos llega en una historia siguiente.", "success")}
        >
          Exportar
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Users className="size-8" />}
          title="Todavía no hay contactos"
          description="Crea el primero para ir armando el CRM. El historial de conversaciones se engancha cuando Track B conecte la bandeja."
          action={
            <Button onClick={() => setCreateOpen(true)} leadingIcon={<Plus className="size-4" />}>
              Nuevo contacto
            </Button>
          }
        />
      ) : (
        <Table columns={COLUMNS} caption="Listado de contactos">
          {visible.map((row) => (
            <tr key={row.id} className="border-b border-transparent last:border-0">
              <td className="px-3 py-1.5" colSpan={COLUMNS.length}>
                <div className="flex flex-wrap items-center gap-3 rounded-full bg-[#f0f0f3]/70 px-4 py-2.5">
                  <Link
                    href={tenantPath(tenantId, `contactos/${row.id}`)}
                    className="flex min-w-44 items-center gap-2.5 font-medium text-foreground hover:underline"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ecebf5] text-[11px] font-semibold text-muted"
                    >
                      {initialsFromName(row.displayName)}
                    </span>
                    {row.displayName}
                  </Link>
                  <span className="w-28 text-sm text-muted">{formatContactChannel(row.channel)}</span>
                  <span
                    className={`inline-flex rounded-[10px] px-3 py-0.5 text-xs font-medium ${row.stageName ? stageTone(row.stageName) : "text-muted"}`}
                  >
                    {row.stageName ?? "—"}
                  </span>
                  <span className="min-w-24 text-sm text-muted">{formatRelativeActivity(row.updatedAt)}</span>
                  <span className="min-w-24 text-sm font-semibold text-muted">
                    {row.amount == null ? "---" : formatOpportunityAmount(row.amount)}
                  </span>
                  <span className="text-sm font-semibold text-muted">{row.assignedToName ?? "—"}</span>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={createOpen} title="Nuevo contacto" onClose={() => setCreateOpen(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <Input
            name="displayName"
            label="Nombre"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
          <Input
            name="phone"
            label="Teléfono"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            name="instagram"
            label="Instagram"
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
          <Input
            name="email"
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Canal</span>
            <select
              className="h-11 rounded-xl border border-border bg-surface px-3"
              value={newChannel}
              onChange={(event) => setNewChannel(event.target.value)}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="unknown">Sin canal</option>
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!displayName.trim()}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function FilterChip({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-full px-3 text-sm font-medium ${
        active
          ? "bg-orbita-900 text-white"
          : "border border-[#e6e6e6] bg-white text-muted"
      }`}
    >
      {children}
    </button>
  );
}
