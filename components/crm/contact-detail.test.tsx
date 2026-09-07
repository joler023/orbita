import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactDetailView } from "./contact-detail";

const { getContact, listContactFields, listContactOpportunities } = vi.hoisted(() => ({
  getContact: vi.fn(),
  listContactFields: vi.fn(),
  listContactOpportunities: vi.fn(),
}));

vi.mock("@/lib/api/contacts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/contacts")>("@/lib/api/contacts");
  return {
    ...actual,
    getContact: (...args: unknown[]) => getContact(...args),
    listContactFields: (...args: unknown[]) => listContactFields(...args),
    listContactOpportunities: (...args: unknown[]) => listContactOpportunities(...args),
  };
});

vi.mock("@/lib/api/pipelines", () => ({
  listPipelines: vi.fn(),
}));

vi.mock("@/lib/api/opportunities", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/opportunities")>("@/lib/api/opportunities");
  return {
    ...actual,
    createOpportunity: vi.fn(),
  };
});

describe("ContactDetailView", () => {
  beforeEach(() => {
    getContact.mockReset();
    listContactFields.mockReset();
    listContactOpportunities.mockReset();
    getContact.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      displayName: "Ana Pérez",
      phone: "+573001112233",
      instagramUsername: null,
      email: "ana@shop.com",
      channel: "whatsapp",
      customFields: {},
      createdAt: "2026-09-07T00:00:00Z",
      updatedAt: "2026-09-07T00:00:00Z",
    });
    listContactFields.mockResolvedValue([]);
    listContactOpportunities.mockResolvedValue([]);
  });

  it("shows identity fields and a conversation placeholder", async () => {
    render(
      <ToastProvider>
        <ContactDetailView tenantId="tenant-1" contactId="11111111-1111-1111-1111-111111111111" />
      </ToastProvider>,
    );

    expect(await screen.findByDisplayValue("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Historial de conversaciones" })).toBeInTheDocument();
    expect(screen.getByText(/Track B/)).toBeInTheDocument();
  });
});
