import { ToastProvider } from "@/components/ui/toast";
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
      <ToastProvider>
        <AppShell tenantId="tenant-1">
        <p>Contenido de la pantalla</p>
        </AppShell>
      </ToastProvider>,
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
      <ToastProvider>
        <AppShell tenantId="tenant-1">
        <p>Contenido</p>
        </AppShell>
      </ToastProvider>,
    );

    expect(window.localStorage.getItem("orbita.lastTenantId")).toBe("tenant-1");
  });

  it("titles the page from the active navigation item", () => {
    render(
      <ToastProvider>
        <AppShell tenantId="tenant-1">
        <p>Contenido</p>
        </AppShell>
      </ToastProvider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Agente IA" })).toBeInTheDocument();
  });
});
