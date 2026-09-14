import type { CurrentUser } from "@/lib/api/auth";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrentUserProvider, landingTenantId, useCurrentUser, useMembership } from "./current-user";

const user: CurrentUser = {
  userId: "u1",
  email: "demo@orbita.local",
  fullName: "Manuel Rodríguez",
  memberships: [
    { tenantId: "t1", slug: "panaderia", name: "Panadería", role: "Owner" },
    { tenantId: "t2", slug: "zapateria", name: "Zapatería", role: "Agent" },
  ],
};

function Probe({ tenantId }: { tenantId: string }) {
  const current = useCurrentUser();
  const membership = useMembership(tenantId);
  return <p>{`${current.fullName} · ${membership?.role ?? "sin acceso"}`}</p>;
}

describe("current user", () => {
  it("shares who is signed in and their role per organization", () => {
    render(
      <CurrentUserProvider user={user}>
        <Probe tenantId="t2" />
      </CurrentUserProvider>,
    );

    expect(screen.getByText("Manuel Rodríguez · Agent")).toBeInTheDocument();
  });

  it("reports no access for an organization the person does not belong to", () => {
    render(
      <CurrentUserProvider user={user}>
        <Probe tenantId="t9" />
      </CurrentUserProvider>,
    );

    expect(screen.getByText("Manuel Rodríguez · sin acceso")).toBeInTheDocument();
  });

  it("lands on the remembered organization, else the first, else nowhere", () => {
    expect(landingTenantId(user, "t2")).toBe("t2");
    expect(landingTenantId(user, "gone")).toBe("t1");
    expect(landingTenantId(user, null)).toBe("t1");
    expect(landingTenantId({ ...user, memberships: [] }, "t1")).toBeNull();
  });
});
