import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionState } from "./permission-state";

describe("PermissionState", () => {
  it("explains the missing permission and who can grant it", () => {
    render(
      <PermissionState
        title="Necesitas permiso de administrador"
        description="Pídele acceso a quien administra tu organización."
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Necesitas permiso de administrador");
    expect(status).toHaveTextContent("Pídele acceso a quien administra tu organización.");
  });
});
