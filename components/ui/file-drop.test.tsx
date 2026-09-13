import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileDrop, validateFile } from "./file-drop";

const accept = [".pdf", ".txt"] as const;
const maxBytes = 1024 * 1024;

function file(name: string, size = 10): File {
  return new File(["x".repeat(size)], name);
}

describe("validateFile", () => {
  it("accepts allowed extensions regardless of case", () => {
    expect(validateFile(file("Catalogo.PDF"), accept, maxBytes)).toBeNull();
  });

  it("explains which formats are allowed", () => {
    expect(validateFile(file("precios.xlsx"), accept, maxBytes)).toBe(
      "«precios.xlsx» no se puede subir. Usa un archivo PDF o TXT.",
    );
  });

  it("explains the size limit and what to do", () => {
    expect(validateFile(file("grande.pdf", maxBytes + 1), accept, maxBytes)).toBe(
      "«grande.pdf» pesa más de 1 MB. Divídelo o comprímelo antes de subirlo.",
    );
  });
});

describe("FileDrop", () => {
  it("passes valid picked files and rejects the rest with a message", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(
      <FileDrop
        label="Arrastra archivos o elige uno"
        hint="PDF o TXT"
        accept={accept}
        maxBytes={maxBytes}
        onFiles={onFiles}
        onReject={onReject}
      />,
    );

    await user.upload(screen.getByLabelText("Arrastra archivos o elige uno"), [
      file("ok.pdf"),
      file("mal.xlsx"),
    ]);

    expect(onFiles).toHaveBeenCalledWith([expect.objectContaining({ name: "ok.pdf" })]);
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("accepts dropped files", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileDrop
        label="Arrastra archivos"
        hint="PDF"
        accept={accept}
        maxBytes={maxBytes}
        onFiles={onFiles}
        onReject={vi.fn()}
      />,
    );

    fireEvent.drop(container.firstElementChild as Element, {
      dataTransfer: { files: [file("soltado.txt")] },
    });

    expect(onFiles).toHaveBeenCalledWith([expect.objectContaining({ name: "soltado.txt" })]);
  });
});
