import type { Membership } from "@/lib/api/auth";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrgSwitcher } from "./org-switcher";

const panaderia: Membership = {
  tenantId: "tenant-1",
  slug: "panaderia",
  name: "Panadería La Espiga",
  role: "Owner",
};

const clinica: Membership = {
  tenantId: "tenant-2",
  slug: "clinica",
  name: "Clínica Sonrisa",
  role: "Viewer",
};

describe("OrgSwitcher", () => {
  it("shows the current organization as plain text when there is only one", () => {
    render(<OrgSwitcher tenantId="tenant-1" memberships={[panaderia]} />);

    expect(screen.getByText("Panadería La Espiga")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers every organization the person belongs to, marking the current one", async () => {
    const user = userEvent.setup();
    render(<OrgSwitcher tenantId="tenant-1" memberships={[panaderia, clinica]} />);

    const trigger = screen.getByRole("button", { name: /Panadería La Espiga/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const current = screen.getByRole("link", { name: "Panadería La Espiga" });
    const other = screen.getByRole("link", { name: "Clínica Sonrisa" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(other).not.toHaveAttribute("aria-current");
    expect(other).toHaveAttribute("href", "/t/tenant-2/inicio");
  });

  it("closes with Escape without leaving the organization", async () => {
    const user = userEvent.setup();
    render(<OrgSwitcher tenantId="tenant-1" memberships={[panaderia, clinica]} />);

    await user.click(screen.getByRole("button", { name: /Panadería La Espiga/ }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: "Clínica Sonrisa" })).not.toBeInTheDocument();
  });

  it("closes the mobile menu when the person picks another organization", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<OrgSwitcher tenantId="tenant-1" memberships={[panaderia, clinica]} onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: /Panadería La Espiga/ }));
    await user.click(screen.getByRole("link", { name: "Clínica Sonrisa" }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("falls back to a neutral label when the path names an organization the user left", () => {
    render(<OrgSwitcher tenantId="tenant-9" memberships={[panaderia, clinica]} />);

    expect(screen.getByRole("button", { name: /Tu organización/ })).toBeInTheDocument();
  });
});
