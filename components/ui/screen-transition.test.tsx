import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScreenTransition } from "./screen-transition";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("ScreenTransition", () => {
  it("animates the screen in", () => {
    usePathname.mockReturnValue("/t/tenant-1/agente");
    render(<ScreenTransition>Contenido</ScreenTransition>);

    expect(screen.getByText("Contenido")).toHaveClass("animate-screen-in");
  });

  it("plays again on the next screen instead of only on first load", () => {
    usePathname.mockReturnValue("/t/tenant-1/agente");
    const { rerender } = render(<ScreenTransition>Contenido</ScreenTransition>);
    const first = screen.getByText("Contenido");

    usePathname.mockReturnValue("/t/tenant-1/contactos");
    rerender(<ScreenTransition>Contenido</ScreenTransition>);

    // A different element means React remounted it, which is what restarts the animation.
    expect(screen.getByText("Contenido")).not.toBe(first);
  });
});
