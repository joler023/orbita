import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InboxWorkspace } from "./inbox-workspace";

describe("InboxWorkspace", () => {
  it("shows the empty state for a tenant with no conversations yet", () => {
    render(<InboxWorkspace tenantId="tenant-1" />);

    expect(screen.getByText("Aún no hay conversaciones")).toBeInTheDocument();
    expect(screen.getByText("Elige una conversación")).toBeInTheDocument();
  });

  it("lets a person switch between filters", async () => {
    const user = userEvent.setup();
    render(<InboxWorkspace tenantId="tenant-1" />);

    const misTab = screen.getByRole("tab", { name: "Mías" });
    await user.click(misTab);

    expect(misTab).toHaveAttribute("aria-selected", "true");
  });

  it("lets a person type in the search field", async () => {
    const user = userEvent.setup();
    render(<InboxWorkspace tenantId="tenant-1" />);

    const search = screen.getByLabelText("Buscar conversaciones");
    await user.type(search, "Ana");

    expect(search).toHaveValue("Ana");
  });
});
