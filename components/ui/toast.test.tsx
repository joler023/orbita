import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger() {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify("No se pudo entrar", "error")}>
      Mostrar
    </button>
  );
}

describe("Toast", () => {
  it("shows a notification after notify", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(screen.getByRole("status")).toHaveTextContent("No se pudo entrar");
  });
});
