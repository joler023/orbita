import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarPanel } from "./sidebar-panel";

describe("SidebarPanel", () => {
  it("shows the brand, navigation and the signed-in account", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(
      <SidebarPanel
        tenantId="tenant-1"
        pathname="/t/tenant-1/agente"
        user={{ userId: "u1", email: "ana@orbita.com", fullName: "Ana Pérez" }}
        organizationName="Panadería Demo"
        onLogout={onLogout}
      />,
    );

    expect(screen.getByRole("img", { name: "Órbita" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agente IA" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Panadería Demo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});
