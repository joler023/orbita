import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("states the consequence and confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="¿Eliminar «catalogo.pdf»?"
        consequence="Aura dejará de usarlo para responder."
        confirmLabel="Eliminar documento"
        destructive
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("Aura dejará de usarlo para responder.");
    await user.click(screen.getByRole("button", { name: "Eliminar documento" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables both actions while the confirmation is in flight", async () => {
    const user = userEvent.setup();
    let resolve: () => void = () => undefined;
    const onConfirm = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    render(
      <ConfirmDialog
        open
        title="¿Seguro?"
        consequence="No se puede deshacer."
        confirmLabel="Sí"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sí" }));
    expect(screen.getByRole("button", { name: "Sí" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    resolve();
  });

  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="¿Seguro?"
        consequence="—"
        confirmLabel="Sí"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
