import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/t/tenant-1/agente",
  useRouter: () => ({ replace: vi.fn() }),
}));

const { getTenant } = vi.hoisted(() => ({ getTenant: vi.fn() }));

vi.mock("@/lib/api/auth", () => ({
  getTenant: (...args: unknown[]) => getTenant(...args),
  logout: vi.fn(),
}));

describe("AppShell", () => {
  beforeEach(() => {
    getTenant.mockReset().mockResolvedValue({ name: "Panadería Demo" });
  });

  it("keeps the sidebar out of the scrolling content column", async () => {
    render(
      <AppShell tenantId="tenant-1">
        <p>Contenido de la pantalla</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    const sidebar = screen.getByRole("complementary");
    expect(main).toHaveTextContent("Contenido de la pantalla");
    expect(sidebar).not.toContainElement(main);
    expect(sidebar.className).toContain("fixed");
    expect(await screen.findByText("Panadería Demo")).toBeInTheDocument();
  });

  it("remembers the organization so the next sign-in lands there", () => {
    render(
      <AppShell tenantId="tenant-1">
        <p>Contenido</p>
      </AppShell>,
    );

    expect(window.localStorage.getItem("orbita.lastTenantId")).toBe("tenant-1");
  });

  it("titles the page from the active navigation item", () => {
    render(
      <AppShell tenantId="tenant-1">
        <p>Contenido</p>
      </AppShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Agente IA" })).toBeInTheDocument();
  });
});
