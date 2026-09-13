import { ToastProvider } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/errors";
import type { KnowledgeDocument } from "@/lib/api/knowledge";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgePanel } from "./knowledge-panel";

const { listKnowledgeDocuments, uploadKnowledgeDocument, addKnowledgeText, reindexKnowledgeDocument, deleteKnowledgeDocument } =
  vi.hoisted(() => ({
    listKnowledgeDocuments: vi.fn(),
    uploadKnowledgeDocument: vi.fn(),
    addKnowledgeText: vi.fn(),
    reindexKnowledgeDocument: vi.fn(),
    deleteKnowledgeDocument: vi.fn(),
  }));

vi.mock("@/lib/api/knowledge", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api/knowledge")>("@/lib/api/knowledge")),
  listKnowledgeDocuments: (...args: unknown[]) => listKnowledgeDocuments(...args),
  uploadKnowledgeDocument: (...args: unknown[]) => uploadKnowledgeDocument(...args),
  addKnowledgeText: (...args: unknown[]) => addKnowledgeText(...args),
  reindexKnowledgeDocument: (...args: unknown[]) => reindexKnowledgeDocument(...args),
  deleteKnowledgeDocument: (...args: unknown[]) => deleteKnowledgeDocument(...args),
}));

const tenantId = "11111111-1111-4111-8111-111111111111";

function doc(overrides: Partial<KnowledgeDocument> = {}): KnowledgeDocument {
  return {
    id: "d1",
    agentId: "a1",
    title: "catalogo.pdf",
    sourceType: "Upload",
    status: "Indexed",
    chunkCount: 128,
    failureReason: null,
    indexedAt: "2026-09-11T12:00:00+00:00",
    createdAt: "2026-09-11T12:00:00+00:00",
    ...overrides,
  };
}

function renderPanel() {
  render(
    <ToastProvider>
      <KnowledgePanel tenantId={tenantId} agentId="a1" />
    </ToastProvider>,
  );
}

describe("KnowledgePanel", () => {
  beforeEach(() => {
    listKnowledgeDocuments.mockReset().mockResolvedValue({ items: [], nextCursor: null });
    uploadKnowledgeDocument.mockReset();
    addKnowledgeText.mockReset();
    reindexKnowledgeDocument.mockReset();
    deleteKnowledgeDocument.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists documents with their indexing state and fragment count", async () => {
    listKnowledgeDocuments.mockResolvedValue({
      items: [doc(), doc({ id: "d2", title: "precios.xlsx", status: "Failed", chunkCount: 0, failureReason: "No pudimos leer el PDF. Puede estar dañado o protegido con contraseña." })],
      nextCursor: null,
    });
    renderPanel();

    expect(await screen.findByText("catalogo.pdf")).toBeInTheDocument();
    expect(screen.getByText("128 fragmentos")).toBeInTheDocument();
    expect(screen.getByText("Listo")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByText("No pudimos leer el PDF. Puede estar dañado o protegido con contraseña."),
    ).toBeInTheDocument();
  });

  it("uploads a picked file and shows it right away", async () => {
    const user = userEvent.setup({ applyAccept: false });
    uploadKnowledgeDocument.mockResolvedValue(doc({ id: "d9", title: "nuevo.pdf", status: "Pending", chunkCount: 0 }));
    renderPanel();

    await user.upload(await screen.findByLabelText("Arrastra archivos o elige uno"), [
      new File(["x"], "nuevo.pdf"),
    ]);

    expect(uploadKnowledgeDocument).toHaveBeenCalledWith(tenantId, "a1", expect.objectContaining({ name: "nuevo.pdf" }));
    expect(await screen.findByText("nuevo.pdf")).toBeInTheDocument();
    expect(screen.getByText("En cola")).toBeInTheDocument();
  });

  it("rejects an unsupported file before uploading it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPanel();

    await user.upload(await screen.findByLabelText("Arrastra archivos o elige uno"), [
      new File(["x"], "hoja.xlsx"),
    ]);

    expect(uploadKnowledgeDocument).not.toHaveBeenCalled();
    expect(
      await screen.findByText("«hoja.xlsx» no se puede subir. Usa un archivo PDF, DOCX, TXT o MD."),
    ).toBeInTheDocument();
  });

  it("adds pasted text", async () => {
    const user = userEvent.setup();
    addKnowledgeText.mockResolvedValue(doc({ id: "d3", title: "Horarios", sourceType: "Manual", status: "Pending" }));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Pegar texto" }));
    await user.type(screen.getByLabelText("¿Qué es este texto?"), "Horarios");
    await user.type(screen.getByLabelText("Texto"), "Abrimos de 7am a 7pm");
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(addKnowledgeText).toHaveBeenCalledWith(tenantId, "a1", {
      title: "Horarios",
      text: "Abrimos de 7am a 7pm",
    });
    expect(await screen.findByText("Horarios")).toBeInTheDocument();
  });

  it("reindexes a document and explains a rejected delete", async () => {
    const user = userEvent.setup();
    listKnowledgeDocuments.mockResolvedValue({ items: [doc()], nextCursor: null });
    reindexKnowledgeDocument.mockResolvedValue(doc({ status: "Pending", chunkCount: 0 }));
    deleteKnowledgeDocument.mockRejectedValue(new ApiError(404, "Knowledge document not found", "no"));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Volver a leer catalogo.pdf" }));
    expect(reindexKnowledgeDocument).toHaveBeenCalledWith(tenantId, "a1", "d1");

    await user.click(screen.getByRole("button", { name: "Eliminar catalogo.pdf" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Tu asistente dejará de usarlo para responder");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar documento" }));

    expect(await screen.findByText("Ese documento ya no existe. Recarga la lista.")).toBeInTheDocument();
  });

  it("polls while something is indexing and stops when everything is done", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listKnowledgeDocuments
      .mockResolvedValueOnce({ items: [doc({ status: "Processing", chunkCount: 0 })], nextCursor: null })
      .mockResolvedValue({ items: [doc()], nextCursor: null });
    renderPanel();

    expect(await screen.findByText("Indexando")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(3000);
    expect(await screen.findByText("Listo")).toBeInTheDocument();

    const callsAfterIndexing = listKnowledgeDocuments.mock.calls.length;
    await vi.advanceTimersByTimeAsync(9000);
    expect(listKnowledgeDocuments.mock.calls.length).toBe(callsAfterIndexing);
  });
});
