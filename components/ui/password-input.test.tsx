import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("hides the password until the eye is pressed", async () => {
    const user = userEvent.setup();
    render(<PasswordInput name="password" label="Contraseña" />);

    const field = screen.getByLabelText("Contraseña");
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(field).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(field).toHaveAttribute("type", "password");
  });

  it("reports its state to assistive technology", async () => {
    const user = userEvent.setup();
    render(<PasswordInput name="password" label="Contraseña" />);

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the label, hint and error of a normal field", () => {
    render(<PasswordInput name="password" label="Contraseña" error="Muy corta" />);

    const field = screen.getByLabelText("Contraseña");
    expect(field).toHaveAccessibleDescription("Muy corta");
    expect(field).toHaveAttribute("aria-invalid", "true");
  });
});
