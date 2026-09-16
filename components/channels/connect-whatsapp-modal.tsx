"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { getMetaAppId, getMetaConfigId } from "@/lib/api/config";
import { connectWhatsApp, type ChannelAccount } from "@/lib/api/channels";
import { toUserMessage } from "@/lib/api/errors";
import { startWhatsAppEmbeddedSignup } from "@/lib/meta/embedded-signup";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

type Step = "intro" | "connecting" | "error";

export function ConnectWhatsAppModal({
  open,
  tenantId,
  onClose,
  onConnected,
}: {
  open: boolean;
  tenantId: string;
  onClose: () => void;
  onConnected: (account: ChannelAccount) => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [error, setError] = useState<string | null>(null);
  const appId = getMetaAppId();
  const configId = getMetaConfigId();
  const configured = appId !== null && configId !== null;

  const close = () => {
    if (step === "connecting") {
      return;
    }
    setStep("intro");
    setError(null);
    onClose();
  };

  const start = async () => {
    if (!appId || !configId) {
      return;
    }
    setStep("connecting");
    setError(null);
    try {
      const signup = await startWhatsAppEmbeddedSignup(appId, configId);
      const account = await connectWhatsApp(tenantId, signup);
      onConnected(account);
      setStep("intro");
      onClose();
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : toUserMessage(signupError));
      setStep("error");
    }
  };

  return (
    <Modal open={open} title="Conectar WhatsApp" onClose={close}>
      {!configured ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Todavía no configuramos la app de Meta en este entorno. Esto lo terminamos de configurar juntos —
            cuando esté listo, este mismo botón te llevará directo a autorizar tu número.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={close}>
            Entendido
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Paso 1 de 2. Vas a entrar a una ventana de Meta para elegir o registrar el WhatsApp de tu negocio.
            Nunca compartimos tu contraseña de Facebook — Meta nos entrega un permiso limitado, no tu cuenta.
          </p>
          {step === "error" && error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <Button
            leadingIcon={<MessageCircle className="size-4" aria-hidden="true" />}
            onClick={() => void start()}
            disabled={step === "connecting"}
          >
            {step === "connecting" ? "Conectando…" : "Conectar con Facebook"}
          </Button>
        </div>
      )}
    </Modal>
  );
}
