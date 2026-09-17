import { ToastProvider } from "@/components/ui/toast";
import { CurrentUserProvider } from "@/lib/session/current-user";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/t/tenant-1/agente",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/api/auth", () => ({ logout: vi.fn() }));

const currentUser = {
  userId: "u1",
  email: "ana@orbita.test",
  fullName: "Ana Pérez",
  memberships: [
    { tenantId: "tenant-1", slug: "panaderia", name: "Panadería Demo", role: "Owner" as const },
  ],
};

describe("AppShell", () => {

  it("keeps the sidebar out of the scrolling content column", async () => {
    render(
      <ToastProvider>
        <CurrentUserProvider user={currentUser}>
          <AppShell tenantId="tenant-1">
        <p>Contenido de la pantalla</p>
          </AppShell>
        </CurrentUserProvider>
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
        <CurrentUserProvider user={currentUser}>
          <AppShell tenantId="tenant-1">
        <p>Contenido</p>
          </AppShell>
        </CurrentUserProvider>
      </ToastProvider>,
    );

    expect(window.localStorage.getItem("orbita.lastTenantId")).toBe("tenant-1");
  });

  it("titles the page from the active navigation item", () => {
    render(
      <ToastProvider>
        <CurrentUserProvider user={currentUser}>
          <AppShell tenantId="tenant-1">
        <p>Contenido</p>
          </AppShell>
        </CurrentUserProvider>
      </ToastProvider>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Agente IA" })).toBeInTheDocument();
  });
});
