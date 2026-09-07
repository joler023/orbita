import { apiRequest } from "./client";

export type ContactListItem = {
  id: string;
  displayName: string;
  phone: string | null;
  instagramUsername: string | null;
  email: string | null;
  channel: string;
  updatedAt: string;
  stageName: string | null;
  amount: number | null;
  assignedToName: string | null;
};

export type ContactDetail = {
  id: string;
  displayName: string;
  phone: string | null;
  instagramUsername: string | null;
  email: string | null;
  channel: string;
  customFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type ContactOpportunitySummary = {
  id: string;
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  title: string;
  amount: number | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  updatedAt: string;
};

export type ContactFieldDefinition = {
  id: string;
  key: string;
  label: string;
  fieldType: string;
};

export type CreateContactBody = {
  displayName: string;
  phone?: string | null;
  instagramUsername?: string | null;
  email?: string | null;
  channel?: string | null;
  customFields?: Record<string, string>;
};

export function searchContacts(
  tenantId: string,
  query: { q?: string; channel?: string } = {},
): Promise<ContactListItem[]> {
  const params = new URLSearchParams();
  if (query.q) {
    params.set("q", query.q);
  }
  if (query.channel) {
    params.set("channel", query.channel);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiRequest<ContactListItem[]>(`/api/tenants/${tenantId}/contacts${suffix}`);
}

export function getContact(tenantId: string, contactId: string): Promise<ContactDetail> {
  return apiRequest<ContactDetail>(`/api/tenants/${tenantId}/contacts/${contactId}`);
}

export function createContact(tenantId: string, body: CreateContactBody): Promise<ContactDetail> {
  return apiRequest<ContactDetail>(`/api/tenants/${tenantId}/contacts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateContact(
  tenantId: string,
  contactId: string,
  body: CreateContactBody,
): Promise<ContactDetail> {
  return apiRequest<ContactDetail>(`/api/tenants/${tenantId}/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listContactOpportunities(
  tenantId: string,
  contactId: string,
): Promise<ContactOpportunitySummary[]> {
  return apiRequest<ContactOpportunitySummary[]>(
    `/api/tenants/${tenantId}/contacts/${contactId}/opportunities`,
  );
}

export function listContactFields(tenantId: string): Promise<ContactFieldDefinition[]> {
  return apiRequest<ContactFieldDefinition[]>(`/api/tenants/${tenantId}/contact-fields`);
}

export function createContactField(
  tenantId: string,
  body: { key: string; label: string; fieldType: string },
): Promise<ContactFieldDefinition> {
  return apiRequest<ContactFieldDefinition>(`/api/tenants/${tenantId}/contact-fields`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function formatContactChannel(channel: string): string {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    default:
      return "Sin canal";
  }
}

export function formatContactActivity(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
