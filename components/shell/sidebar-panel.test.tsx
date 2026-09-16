import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarPanel } from "./sidebar-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe("SidebarPanel", () => {
  it("shows the brand, navigation, the signed-in account and a way out", () => {
    render(
      <ToastProvider>
        <SidebarPanel
        tenantId="tenant-1"
        pathname="/t/tenant-1/agente"
        user={{ email: "ana@orbita.com", fullName: "Ana Pérez" }}
        memberships={[
          { tenantId: "tenant-1", slug: "panaderia", name: "Panadería Demo", role: "Owner" },
        ]}
        />
      </ToastProvider>,
    );

    expect(screen.getByRole("img", { name: "Órbita" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agente IA" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Panadería Demo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });
});
