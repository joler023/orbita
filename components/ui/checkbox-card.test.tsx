import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckboxCard } from "./checkbox-card";

describe("CheckboxCard", () => {
  it("toggles and is described by its description", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <CheckboxCard
        checked={false}
        onCheckedChange={onCheckedChange}
        title="Consultar documentos"
        description="Busca en lo que subiste."
      />,
    );

    const box = screen.getByRole("checkbox", { name: /Consultar documentos/ });
    expect(box).toHaveAccessibleDescription("Busca en lo que subiste.");

    await user.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("is disabled and explains why when a reason is given", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <CheckboxCard
        checked={false}
        onCheckedChange={onCheckedChange}
        title="Registrar oportunidad"
        description="Crea una oportunidad."
        disabledReason="Disponible cuando se active el módulo."
      />,
    );

    const box = screen.getByRole("checkbox", { name: /Registrar oportunidad/ });
    expect(box).toBeDisabled();
    expect(box).toHaveAccessibleDescription("Disponible cuando se active el módulo.");

    await user.click(box);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
