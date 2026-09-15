"use client";

import { useMembership } from "@/lib/session/current-user";
import { ChannelsPanel } from "./channels-panel";

export function ChannelsWorkspace({ tenantId }: { tenantId: string }) {
  const membership = useMembership(tenantId);
  return <ChannelsPanel tenantId={tenantId} viewerRole={membership?.role ?? "Viewer"} />;
}
