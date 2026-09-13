import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("links the label and accepts typing", async () => {
    const user = userEvent.setup();
    render(<Textarea name="instructions" label="Instrucciones" />);

    const field = screen.getByLabelText("Instrucciones");
    await user.type(field, "Hablas de tú");

    expect(field).toHaveValue("Hablas de tú");
  });

  it("describes the field with its error instead of the hint", () => {
    render(
      <Textarea name="instructions" label="Instrucciones" hint="Una idea por frase" error="Escribe algo" />,
    );

    const field = screen.getByLabelText("Instrucciones");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("Escribe algo");
    expect(screen.queryByText("Una idea por frase")).not.toBeInTheDocument();
  });
});
