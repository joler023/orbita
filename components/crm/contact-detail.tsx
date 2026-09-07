"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  createContactField,
  formatContactChannel,
  getContact,
  listContactFields,
  listContactOpportunities,
  updateContact,
  type ContactDetail,
  type ContactFieldDefinition,
  type ContactOpportunitySummary,
} from "@/lib/api/contacts";
import { toUserMessage } from "@/lib/api/errors";
import { createOpportunity, formatOpportunityAmount } from "@/lib/api/opportunities";
import { listPipelines } from "@/lib/api/pipelines";
import { tenantPath } from "@/lib/navigation";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function ContactDetailView({
  tenantId,
  contactId,
}: {
  tenantId: string;
  contactId: string;
}) {
  const { notify } = useToast();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [fields, setFields] = useState<ContactFieldDefinition[]>([]);
  const [deals, setDeals] = useState<ContactOpportunitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [dealOpen, setDealOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("Text");

  const load = useCallback(async () => {
    const [next, nextFields, nextDeals] = await Promise.all([
      getContact(tenantId, contactId),
      listContactFields(tenantId),
      listContactOpportunities(tenantId, contactId),
    ]);
    setContact(next);
    setFields(nextFields);
    setDeals(nextDeals);
    setDisplayName(next.displayName);
    setPhone(next.phone ?? "");
    setInstagram(next.instagramUsername ?? "");
    setEmail(next.email ?? "");
    setChannel(next.channel);
    setCustomValues(next.customFields);
  }, [contactId, tenantId]);

  useEffect(() => {
    let cancelled = false;
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
    return () => {
      cancelled = true;
    };
  }, [load, notify]);

  async function saveIdentity() {
    try {
      const next = await updateContact(tenantId, contactId, {
        displayName,
        phone: phone || null,
        instagramUsername: instagram || null,
        email: email || null,
        channel,
        customFields: customValues,
      });
      setContact(next);
      notify("Contacto actualizado.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  }

  async function handleCreateDeal() {
    try {
      const pipelines = await listPipelines(tenantId);
      const pipeline = pipelines.find((item) => item.isDefault) ?? pipelines[0];
      if (!pipeline) {
        notify("Crea un pipeline antes de abrir una oportunidad.", "error");
        return;
      }
      await createOpportunity(tenantId, pipeline.id, {
        title: dealTitle,
        amount: dealAmount ? Number(dealAmount) : null,
        contactId,
      });
      setDealOpen(false);
      setDealTitle("");
      setDealAmount("");
      setDeals(await listContactOpportunities(tenantId, contactId));
      notify("Oportunidad creada.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  }

  async function handleCreateField() {
    try {
      const created = await createContactField(tenantId, {
        key: fieldKey,
        label: fieldLabel,
        fieldType,
      });
      setFields((current) => [...current, created]);
      setFieldOpen(false);
      setFieldKey("");
      setFieldLabel("");
      setFieldType("Text");
      notify("Campo añadido.", "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    }
  }

  if (loading || !contact) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href={tenantPath(tenantId, "contactos")} className="text-sm text-orbita-700 hover:underline">
        ← Volver a contactos
      </Link>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 lg:grid-cols-2">
        <Input
          name="detail-name"
          label="Nombre"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <Input name="detail-phone" label="Teléfono" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Input
          name="detail-instagram"
          label="Instagram"
          value={instagram}
          onChange={(event) => setInstagram(event.target.value)}
        />
        <Input
          name="detail-email"
          label="Correo"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Canal</span>
          <select
            className="h-11 rounded-xl border border-border bg-surface px-3"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="unknown">Sin canal</option>
          </select>
          <span className="text-xs text-muted">{formatContactChannel(channel)}</span>
        </label>
        <div className="flex items-end">
          <Button onClick={() => void saveIdentity()}>Guardar</Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Campos personalizados</h2>
          <Button size="sm" variant="secondary" onClick={() => setFieldOpen(true)}>
            Añadir campo
          </Button>
        </div>
        {fields.length === 0 ? (
          <p className="text-sm text-muted">Define campos extra (ciudad, origen, etc.) sin tocar el esquema.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <Input
                key={field.id}
                name={`field-${field.key}`}
                label={field.label}
                value={customValues[field.key] ?? ""}
                onChange={(event) =>
                  setCustomValues((current) => ({ ...current, [field.key]: event.target.value }))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Oportunidades</h2>
          <Button size="sm" leadingIcon={<Plus className="size-4" />} onClick={() => setDealOpen(true)}>
            Nueva oportunidad
          </Button>
        </div>
        {deals.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay un trato ligado a este contacto.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {deals.map((deal) => (
              <li key={deal.id} className="rounded-lg border border-border px-3 py-2">
                <p className="font-medium">{deal.title}</p>
                <p className="text-sm text-muted">
                  {deal.pipelineName} · {deal.stageName} · {formatOpportunityAmount(deal.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EmptyState
        icon={<Inbox className="size-8" />}
        title="Historial de conversaciones"
        description="Esta ficha queda lista para el hilo de WhatsApp e Instagram. Track B lo conecta cuando la bandeja exista."
      />

      <Modal open={dealOpen} title="Nueva oportunidad" onClose={() => setDealOpen(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateDeal();
          }}
        >
          <Input
            name="deal-title"
            label="Título"
            value={dealTitle}
            onChange={(event) => setDealTitle(event.target.value)}
            required
          />
          <Input
            name="deal-amount"
            label="Valor"
            type="number"
            value={dealAmount}
            onChange={(event) => setDealAmount(event.target.value)}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDealOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!dealTitle.trim()}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={fieldOpen} title="Nuevo campo" onClose={() => setFieldOpen(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateField();
          }}
        >
          <Input
            name="field-key"
            label="Clave"
            hint="minúsculas, sin espacios"
            value={fieldKey}
            onChange={(event) => setFieldKey(event.target.value)}
            required
          />
          <Input
            name="field-label"
            label="Etiqueta"
            value={fieldLabel}
            onChange={(event) => setFieldLabel(event.target.value)}
            required
          />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              className="h-11 rounded-xl border border-border bg-surface px-3"
              value={fieldType}
              onChange={(event) => setFieldType(event.target.value)}
            >
              <option value="Text">Texto</option>
              <option value="Number">Número</option>
              <option value="Date">Fecha</option>
            </select>
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFieldOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!fieldKey.trim() || !fieldLabel.trim()}>
              Añadir
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
