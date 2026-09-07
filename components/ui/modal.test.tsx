import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    render(
      <Modal open={false} title="Detalle" onClose={() => undefined}>
        Cuerpo
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal open title="Detalle" onClose={onClose}>
        Cuerpo
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Detalle" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
