import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("announces what happened and offers a retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="No pudimos cargar tus asistentes"
        description="Revisa tu conexión e inténtalo de nuevo."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tus asistentes");
    await user.click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("omits the retry button when the error cannot be retried", () => {
    render(<ErrorState title="Algo falló" description="Contacta a soporte." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
