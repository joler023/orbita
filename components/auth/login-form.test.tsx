import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const { login, writeSessionUser, readLastTenantId, replace } = vi.hoisted(() => ({
  login: vi.fn(),
  writeSessionUser: vi.fn(),
  readLastTenantId: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/auth", () => ({
  login: (...args: unknown[]) => login(...args),
}));

vi.mock("@/lib/session/storage", () => ({
  writeSessionUser: (...args: unknown[]) => writeSessionUser(...args),
  readLastTenantId: () => readLastTenantId(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    login.mockReset();
    writeSessionUser.mockReset();
    readLastTenantId.mockReset();
    replace.mockReset();
  });

  it("shows Spanish copy for invalid credentials", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api/errors");
    login.mockRejectedValue(new ApiError(401, "Invalid credentials", "no"));

    render(<LoginForm />);
    await user.type(screen.getByLabelText("Correo"), "ana@orbita.test");
    await user.type(screen.getByLabelText("Contraseña"), "secretsecret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("El correo o la contraseña no coinciden.")).toBeInTheDocument();
  });

  it("asks for a two-factor code when the API requires it", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@/lib/api/errors");
    login.mockRejectedValueOnce(new ApiError(401, "Two-factor code required", "need code"));
    login.mockResolvedValueOnce({ userId: "u1", email: "ana@orbita.test", fullName: "Ana" });
    readLastTenantId.mockReturnValue("tenant-1");

    render(<LoginForm />);
    await user.type(screen.getByLabelText("Correo"), "ana@orbita.test");
    await user.type(screen.getByLabelText("Contraseña"), "secretsecret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByLabelText("Código de verificación")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Código de verificación"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenLastCalledWith({
      email: "ana@orbita.test",
      password: "secretsecret",
      twoFactorCode: "123456",
    });
    expect(replace).toHaveBeenCalledWith("/t/tenant-1/inicio");
  });
});
