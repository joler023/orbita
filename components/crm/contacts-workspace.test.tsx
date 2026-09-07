import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactsWorkspace } from "./contacts-workspace";

const { searchContacts, createContact } = vi.hoisted(() => ({
  searchContacts: vi.fn(),
  createContact: vi.fn(),
}));

vi.mock("@/lib/api/contacts", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/contacts")>("@/lib/api/contacts");
  return {
    ...actual,
    searchContacts: (...args: unknown[]) => searchContacts(...args),
    createContact: (...args: unknown[]) => createContact(...args),
  };
});

const ana = {
  id: "11111111-1111-1111-1111-111111111111",
  displayName: "Ana Pérez",
  phone: "+573001112233",
  instagramUsername: null,
  email: "ana@shop.com",
  channel: "whatsapp",
  updatedAt: "2026-09-07T00:00:00Z",
  stageName: "Propuesta",
  amount: 1500,
  assignedToName: "Carlos",
};

describe("ContactsWorkspace", () => {
  beforeEach(() => {
    searchContacts.mockReset();
    createContact.mockReset();
    searchContacts.mockResolvedValue([ana]);
  });

  it("renders list columns and a contact row", async () => {
    render(
      <ToastProvider>
        <ContactsWorkspace tenantId="tenant-1" />
      </ToastProvider>,
    );

    expect(await screen.findByRole("link", { name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Canal" })).toBeInTheDocument();
    expect(screen.getByText("Propuesta")).toBeInTheDocument();
    expect(screen.getByText("Carlos")).toBeInTheDocument();
  });

  it("creates a contact from the modal", async () => {
    const user = userEvent.setup();
    createContact.mockResolvedValue({ ...ana, displayName: "Luis" });
    searchContacts.mockResolvedValueOnce([ana]).mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <ContactsWorkspace tenantId="tenant-1" />
      </ToastProvider>,
    );

    await screen.findByRole("link", { name: "Ana Pérez" });
    await user.click(screen.getByRole("button", { name: "Nuevo contacto" }));
    await user.type(screen.getByLabelText("Nombre"), "Luis");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(createContact).toHaveBeenCalledWith(
      "tenant-1",
      expect.objectContaining({ displayName: "Luis", channel: "whatsapp" }),
    );
  });
});
