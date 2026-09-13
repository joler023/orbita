import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("always renders a text label next to the tone", () => {
    render(<StatusBadge tone="success" label="Listo" />);

    const badge = screen.getByText("Listo");
    expect(badge).toHaveAttribute("data-tone", "success");
  });

  it("hides the decorative icon from assistive technology", () => {
    render(<StatusBadge tone="danger" label="Error" icon={<svg data-testid="icon" />} />);

    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});
