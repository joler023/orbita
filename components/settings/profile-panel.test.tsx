import type { CurrentUser } from "@/lib/api/auth";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfilePanel } from "./profile-panel";

const user: CurrentUser = {
  userId: "u1",
  email: "ana@negocio.com",
  fullName: "Ana Ríos",
  memberships: [],
};

describe("ProfilePanel", () => {
  it("shows the signed-in person's name and email", () => {
    render(<ProfilePanel user={user} />);

    expect(screen.getByText("Ana Ríos")).toBeInTheDocument();
    expect(screen.getByText("ana@negocio.com")).toBeInTheDocument();
  });

  it("links to the recover-password flow instead of a dedicated change-password form", () => {
    render(<ProfilePanel user={user} />);

    const link = screen.getByRole("link", { name: "Cambiar mi contraseña" });
    expect(link).toHaveAttribute("href", "/recuperar");
  });
});
