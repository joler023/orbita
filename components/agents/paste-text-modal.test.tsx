import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasteTextModal } from "./paste-text-modal";

describe("PasteTextModal", () => {
  it("asks for a name and the text before saving", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PasteTextModal open onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Ponle un nombre para reconocerlo después.")).toBeInTheDocument();
    expect(screen.getByText("Pega aquí lo que quieres que tu asistente sepa.")).toBeInTheDocument();
  });

  it("submits the trimmed content", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<PasteTextModal open onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("¿Qué es este texto?"), "  Horarios ");
    await user.type(screen.getByLabelText("Texto"), " Abrimos de 7am a 7pm ");
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "Horarios", text: "Abrimos de 7am a 7pm" });
    expect(onClose).toHaveBeenCalled();
  });
});
