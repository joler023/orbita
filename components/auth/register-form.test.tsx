import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

const { registerOrganization, login, writeSessionUser, writeLastTenantId, replace } = vi.hoisted(
  () => ({
    registerOrganization: vi.fn(),
    login: vi.fn(),
    writeSessionUser: vi.fn(),
    writeLastTenantId: vi.fn(),
    replace: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/api/auth", () => ({
  registerOrganization: (...args: unknown[]) => registerOrganization(...args),
  login: (...args: unknown[]) => login(...args),
}));

vi.mock("@/lib/session/storage", () => ({
  writeSessionUser: (...args: unknown[]) => writeSessionUser(...args),
  writeLastTenantId: (...args: unknown[]) => writeLastTenantId(...args),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    registerOrganization.mockReset();
    login.mockReset();
    writeSessionUser.mockReset();
    writeLastTenantId.mockReset();
    replace.mockReset();
  });

  it("registers, logs in, and goes to Inicio", async () => {
    const user = userEvent.setup();
    registerOrganization.mockResolvedValue({
      tenantId: "tenant-1",
      tenantSlug: "negocio",
      businessName: "Negocio",
      userId: "u1",
      email: "ana@orbita.test",
      fullName: "Ana Pérez",
    });
    login.mockResolvedValue({ userId: "u1", email: "ana@orbita.test", fullName: "Ana Pérez" });

    render(<RegisterForm />);
    await user.type(screen.getByLabelText("Nombre del negocio"), "Negocio");
    await user.type(screen.getByLabelText("Tu nombre"), "Ana Pérez");
    await user.type(screen.getByLabelText("Correo"), "ana@orbita.test");
    await user.type(screen.getByLabelText("Contraseña"), "secretsecret");
    await user.click(screen.getByRole("button", { name: "Crear organización" }));

    expect(registerOrganization).toHaveBeenCalledWith({
      businessName: "Negocio",
      fullName: "Ana Pérez",
      email: "ana@orbita.test",
      password: "secretsecret",
    });
    expect(login).toHaveBeenCalled();
    expect(writeLastTenantId).toHaveBeenCalledWith("tenant-1");
    expect(replace).toHaveBeenCalledWith("/t/tenant-1/inicio");
  });
});
