import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("shows the title and description", () => {
    render(
      <EmptyState
        title="Todavía no hay conversaciones"
        description="Cuando alguien escriba, aparecerán aquí."
      />,
    );

    expect(screen.getByRole("heading", { name: "Todavía no hay conversaciones" })).toBeInTheDocument();
    expect(screen.getByText("Cuando alguien escriba, aparecerán aquí.")).toBeInTheDocument();
  });
});
