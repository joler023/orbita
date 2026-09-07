import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SidebarNav } from "./sidebar-nav";

describe("SidebarNav", () => {
  it("marks the current page as active", () => {
    render(<SidebarNav tenantId="tenant-1" pathname="/t/tenant-1/inicio" />);

    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Bandeja" })).not.toHaveAttribute("aria-current");
  });
});
