import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("associates the label with the field", () => {
    render(<Input name="email" label="Correo" placeholder="tú@negocio.com" />);

    expect(screen.getByLabelText("Correo")).toHaveAttribute("name", "email");
  });

  it("announces a validation error", () => {
    render(<Input name="password" label="Contraseña" error="Mínimo 8 caracteres" />);

    const field = screen.getByLabelText("Contraseña");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
  });
});
