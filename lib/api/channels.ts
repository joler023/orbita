import { apiRequest } from "./client";

export type ChannelKind = "WhatsApp" | "Instagram";
export type ChannelStatus = "PendingVerification" | "Connected" | "TokenExpired" | "Disconnected";

export type ChannelAccount = {
  id: string;
  kind: ChannelKind;
  displayName: string;
  externalId: string;
  status: ChannelStatus;
  tokenExpiresAt: string | null;
  expiresSoon: boolean;
  createdAt: string;
};

export type ConnectWhatsAppRequest = {
  code: string;
  wabaId: string;
  phoneNumberId: string;
};

function channelsPath(tenantId: string): string {
  return `/api/tenants/${tenantId}/channels`;
}

export function listChannels(tenantId: string): Promise<ChannelAccount[]> {
  return apiRequest<ChannelAccount[]>(channelsPath(tenantId));
}

/**
 * `code`/`wabaId`/`phoneNumberId` come from Meta's WhatsApp Embedded Signup callback —
 * the frontend never sees or stores a real access token, only this authorization code,
 * which the backend exchanges server-side (see CLAUDE.md's Channels section, ORB-B01).
 */
export function connectWhatsApp(
  tenantId: string,
  request: ConnectWhatsAppRequest,
): Promise<ChannelAccount> {
  return apiRequest<ChannelAccount>(`${channelsPath(tenantId)}/whatsapp`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** Retries the webhook subscription for an account left `PendingVerification`. */
export function verifyChannel(tenantId: string, channelId: string): Promise<ChannelAccount> {
  return apiRequest<ChannelAccount>(`${channelsPath(tenantId)}/${channelId}/verify`, {
    method: "POST",
  });
}

export function disconnectChannel(tenantId: string, channelId: string): Promise<void> {
  return apiRequest<void>(`${channelsPath(tenantId)}/${channelId}`, { method: "DELETE" });
}
