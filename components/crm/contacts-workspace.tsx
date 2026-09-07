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
  formatContactActivity,
  formatContactChannel,
  searchContacts,
  type ContactListItem,
} from "@/lib/api/contacts";
import { formatOpportunityAmount } from "@/lib/api/opportunities";
import { toUserMessage } from "@/lib/api/errors";
import { tenantPath } from "@/lib/navigation";
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
  const [channel, setChannel] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [newChannel, setNewChannel] = useState("whatsapp");

  const load = useCallback(async () => {
    const next = await searchContacts(tenantId, {
      q: query.trim() || undefined,
      channel: channel || undefined,
    });
    setRows(next);
  }, [channel, query, tenantId]);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-56 flex-1 flex-wrap items-center gap-2">
          <div className="min-w-56 flex-1">
            <Input
              name="contact-search"
              placeholder="Buscar por nombre, teléfono o Instagram"
              aria-label="Buscar contactos"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leadingIcon={<Search className="size-4" />}
            />
          </div>
          <label className="sr-only" htmlFor="contact-channel">
            Canal
          </label>
          <select
            id="contact-channel"
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option value="">Todos los canales</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
        <Button leadingIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          Nuevo contacto
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
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
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={tenantPath(tenantId, `contactos/${row.id}`)}
                  className="font-medium text-orbita-700 hover:underline"
                >
                  {row.displayName}
                </Link>
                <p className="text-xs text-muted">{row.phone ?? (row.instagramUsername ? `@${row.instagramUsername}` : "—")}</p>
              </td>
              <td className="px-4 py-3 text-muted">{formatContactChannel(row.channel)}</td>
              <td className="px-4 py-3 text-muted">{row.stageName ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{formatContactActivity(row.updatedAt)}</td>
              <td className="px-4 py-3 text-muted">
                {row.amount == null ? "—" : formatOpportunityAmount(row.amount)}
              </td>
              <td className="px-4 py-3 text-muted">{row.assignedToName ?? "—"}</td>
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
