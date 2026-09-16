"use client";

import { Tabs } from "@/components/ui/tabs";
import { useCurrentUser, useMembership } from "@/lib/session/current-user";
import { useState } from "react";
import { BillingPanel } from "./billing-panel";
import { ProfilePanel } from "./profile-panel";
import { TeamPanel } from "./team-panel";

type SettingsTab = "equipo" | "facturacion" | "perfil";

const TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: "equipo", label: "Equipo" },
  { value: "facturacion", label: "Facturación" },
  { value: "perfil", label: "Mi perfil" },
];

export function SettingsWorkspace({ tenantId }: { tenantId: string }) {
  const [tab, setTab] = useState<SettingsTab>("equipo");
  const user = useCurrentUser();
  const membership = useMembership(tenantId);
  const viewerRole = membership?.role ?? "Viewer";

  return (
    <Tabs label="Ajustes" items={TABS} value={tab} onChange={setTab}>
      {tab === "equipo" ? <TeamPanel tenantId={tenantId} viewerRole={viewerRole} /> : null}
      {tab === "facturacion" ? <BillingPanel tenantId={tenantId} viewerRole={viewerRole} /> : null}
      {tab === "perfil" ? <ProfilePanel user={user} /> : null}
    </Tabs>
  );
}
