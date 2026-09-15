"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { canManageChannels, type MemberRole } from "@/lib/api/auth";
import {
  disconnectChannel,
  listChannels,
  verifyChannel,
  type ChannelAccount,
} from "@/lib/api/channels";
import { toUserMessage } from "@/lib/api/errors";
import { Plus, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectWhatsAppModal } from "./connect-whatsapp-modal";

type LoadState = "loading" | "ready" | "error";

const STATUS_TONE: Record<ChannelAccount["status"], StatusTone> = {
  Connected: "success",
  PendingVerification: "info",
  TokenExpired: "danger",
  Disconnected: "neutral",
};

const STATUS_LABEL: Record<ChannelAccount["status"], string> = {
  Connected: "Conectado",
  PendingVerification: "Verificando…",
  TokenExpired: "Token vencido",
  Disconnected: "Desconectado",
};

export function ChannelsPanel({ tenantId, viewerRole }: { tenantId: string; viewerRole: MemberRole }) {
  const { notify } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState<ChannelAccount | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canManage = canManageChannels(viewerRole);

  useEffect(() => {
    let cancelled = false;
    listChannels(tenantId)
      .then((result) => {
        if (!cancelled) {
          setChannels(result);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, reloadKey]);

  const verify = async (channel: ChannelAccount) => {
    setBusyId(channel.id);
    try {
      const updated = await verifyChannel(tenantId, channel.id);
      setChannels((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify(`${channel.displayName} quedó conectado.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDisconnect = async () => {
    if (!pendingDisconnect) {
      return;
    }
    const channel = pendingDisconnect;
    try {
      await disconnectChannel(tenantId, channel.id);
      setChannels((current) => current.filter((item) => item.id !== channel.id));
      notify(`Desconectamos ${channel.displayName}. Tu historial de conversaciones sigue ahí.`, "success");
    } catch (error) {
      notify(toUserMessage(error), "error");
    } finally {
      setPendingDisconnect(null);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando canales">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="No pudimos cargar tus canales"
        description="Revisa tu conexión. Si sigue pasando, vuelve a intentarlo en un momento."
        onRetry={() => {
          setState("loading");
          setReloadKey((key) => key + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setConnecting(true)}>
            Conectar WhatsApp
          </Button>
        </div>
      ) : null}

      {channels.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
          <Radio className="size-8 text-orbita-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Aún no hay canales conectados</h2>
          <p className="max-w-md text-sm text-muted">
            Conecta el WhatsApp de tu negocio para empezar a recibir mensajes en Órbita.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{channel.displayName}</p>
                <p className="text-xs text-muted">
                  {channel.kind} · {channel.phoneE164 ?? channel.externalId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {channel.expiresSoon ? <StatusBadge tone="warning" label="Vence pronto" /> : null}
                <StatusBadge tone={STATUS_TONE[channel.status]} label={STATUS_LABEL[channel.status]} />
                {canManage && channel.status === "PendingVerification" ? (
                  <Button size="sm" variant="secondary" disabled={busyId === channel.id} onClick={() => void verify(channel)}>
                    Verificar
                  </Button>
                ) : null}
                {canManage ? (
                  <Button size="sm" variant="ghost" onClick={() => setPendingDisconnect(channel)}>
                    Desconectar
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConnectWhatsAppModal
        open={connecting}
        tenantId={tenantId}
        onClose={() => setConnecting(false)}
        onConnected={(account) => {
          setChannels((current) => [...current, account]);
          notify(`${account.displayName} está conectado.`, "success");
        }}
      />
      <ConfirmDialog
        open={pendingDisconnect !== null}
        title={`¿Desconectar ${pendingDisconnect?.displayName ?? "este canal"}?`}
        consequence="Dejarás de recibir mensajes nuevos por este canal. El historial de conversaciones se conserva y puedes volver a conectarlo después."
        confirmLabel="Desconectar"
        destructive
        onConfirm={confirmDisconnect}
        onClose={() => setPendingDisconnect(null)}
      />
    </div>
  );
}
