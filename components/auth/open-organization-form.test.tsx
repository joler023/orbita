import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OpenOrganizationForm, readTenantId } from "./open-organization-form";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const tenantId = "7cb5a288-953a-4ae2-b899-490ad16ee897";

describe("readTenantId", () => {
  it("accepts a full dashboard link, a bare id or neither", () => {
    expect(readTenantId(`http://localhost:3000/t/${tenantId}/agente`)).toBe(tenantId);
    expect(readTenantId(`  ${tenantId}  `)).toBe(tenantId);
    expect(readTenantId("mi empresa")).toBeNull();
  });
});

describe("OpenOrganizationForm", () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it("opens the organization from a pasted link", async () => {
    const user = userEvent.setup();
    render(<OpenOrganizationForm />);

    // People paste this link rather than typing it.
    await user.click(screen.getByLabelText("¿Tienes el enlace de tu organización?"));
    await user.paste(`http://localhost:3000/t/${tenantId}/agente`);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(replace).toHaveBeenCalledWith(`/t/${tenantId}/inicio`);
  });

  it("explains what to paste when the link is not one", async () => {
    const user = userEvent.setup();
    render(<OpenOrganizationForm />);

    await user.type(screen.getByLabelText("¿Tienes el enlace de tu organización?"), "mi empresa");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(replace).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "Ese enlace no parece de una organización de Órbita. Cópialo completo desde la barra del navegador.",
      ),
    ).toBeInTheDocument();
  });
});
