import { ToastProvider } from "@/components/ui/toast";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./sign-out-button";

const { replace, logout, clearLocalSession } = vi.hoisted(() => ({
  replace: vi.fn(),
  logout: vi.fn(),
  clearLocalSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api/auth", () => ({ logout: (...args: unknown[]) => logout(...args) }));
vi.mock("@/lib/session/storage", async () => ({
  ...(await vi.importActual<typeof import("@/lib/session/storage")>("@/lib/session/storage")),
  clearLocalSession: () => clearLocalSession(),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    replace.mockReset();
    logout.mockReset().mockResolvedValue(undefined);
    clearLocalSession.mockReset();
  });

  it("ends the session and goes back to the login", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(logout).toHaveBeenCalled();
    expect(clearLocalSession).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(await screen.findByText("Cerraste sesión. ¡Hasta pronto!")).toBeInTheDocument();
  });

  it("still lets the person leave when the API is down", async () => {
    const user = userEvent.setup();
    logout.mockRejectedValue(new Error("offline"));
    render(
      <ToastProvider>
        <SignOutButton />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(clearLocalSession).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
