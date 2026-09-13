import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes its state and requests the opposite value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Activar Aura" />);

    const control = screen.getByRole("switch", { name: "Activar Aura" });
    expect(control).toHaveAttribute("aria-checked", "false");

    await user.click(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("can be toggled from the keyboard", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked onCheckedChange={onCheckedChange} label="Activar" showLabel />);

    await user.tab();
    await user.keyboard(" ");

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("ignores clicks when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked onCheckedChange={onCheckedChange} label="Activar" disabled />);

    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
