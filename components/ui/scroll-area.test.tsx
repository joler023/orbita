import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  it("scrolls vertically by default", () => {
    render(<ScrollArea label="Documentos">contenido</ScrollArea>);

    expect(screen.getByRole("region", { name: "Documentos" }).className).toContain("overflow-y-auto");
  });

  it("becomes a keyboard stop only when asked, for content nothing can focus", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ScrollArea label="Documentos">contenido</ScrollArea>);

    await user.tab();
    expect(screen.getByRole("region", { name: "Documentos" })).not.toHaveFocus();

    rerender(
      <ScrollArea label="Documentos" focusable>
        contenido
      </ScrollArea>,
    );
    await user.tab();
    expect(screen.getByRole("region", { name: "Documentos" })).toHaveFocus();
  });

  it("can scroll sideways instead", () => {
    render(<ScrollArea orientation="horizontal" label="Pestañas" />);

    expect(screen.getByRole("region", { name: "Pestañas" }).className).toContain("overflow-x-auto");
  });

  it("stays unnamed when it is only a scrolling box", () => {
    const { container } = render(<ScrollArea className="h-10">contenido</ScrollArea>);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("h-10");
  });
});
