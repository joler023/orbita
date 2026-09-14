import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatKnowledgeMeta, KnowledgeStatusBadge } from "./knowledge-status";

describe("knowledge status", () => {
  it("names every indexing state in Spanish", () => {
    const { rerender } = render(<KnowledgeStatusBadge status="Pending" />);
    expect(screen.getByText("En cola")).toBeInTheDocument();

    rerender(<KnowledgeStatusBadge status="Processing" />);
    expect(screen.getByText("Indexando")).toBeInTheDocument();

    rerender(<KnowledgeStatusBadge status="Indexed" />);
    expect(screen.getByText("Listo")).toBeInTheDocument();

    rerender(<KnowledgeStatusBadge status="Failed" />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("only counts fragments once the document is searchable", () => {
    expect(formatKnowledgeMeta(128, "Indexed")).toBe("128 fragmentos");
    expect(formatKnowledgeMeta(1, "Indexed")).toBe("1 fragmento");
    expect(formatKnowledgeMeta(0, "Processing")).toBe("Estamos leyéndolo…");
    expect(formatKnowledgeMeta(0, "Pending")).toBe("Esperando turno para leerse");
    expect(formatKnowledgeMeta(0, "Failed")).toBe("No se pudo usar");
  });
});
