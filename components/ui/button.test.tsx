import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders the label and calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Guardar</Button>);

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
