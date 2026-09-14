import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Harness() {
  const { notify } = useToast();
  return (
    <div>
      <button type="button" onClick={() => notify("Guardamos tus cambios.", "success")}>
        Guardar
      </button>
      <button type="button" onClick={() => notify("No pudimos guardar.", "error")}>
        Fallar
      </button>
    </div>
  );
}

function renderHarness() {
  render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
}

describe("ToastProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces the message with its tone", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Guardamos tus cambios.");
    expect(toast.className).toContain("bg-success-bg");
    expect(toast.className).toContain("animate-toast-in");
  });

  it("can be dismissed by hand", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await user.click(screen.getByRole("button", { name: "Cerrar aviso" }));

    expect(screen.getByRole("status").className).toContain("animate-toast-out");
  });

  it("clears a success on its own but keeps an error until it is read", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await user.click(screen.getByRole("button", { name: "Fallar" }));
    expect(screen.getAllByRole("status")).toHaveLength(2);

    await act(() => vi.advanceTimersByTimeAsync(6_000));

    const remaining = screen.getAllByRole("status");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toHaveTextContent("No pudimos guardar.");
  });
});
