import { describe, expect, it } from "vitest";
import { formatHeaderDate, initialsFromName, isActivePath, isUuid, tenantPath } from "./navigation";

describe("navigation helpers", () => {
  it("builds tenant paths and detects the active item", () => {
    expect(tenantPath("aaa", "bandeja")).toBe("/t/aaa/bandeja");
    expect(isActivePath("/t/aaa/inicio", "aaa", "inicio")).toBe(true);
    expect(isActivePath("/t/aaa/bandeja", "aaa", "inicio")).toBe(false);
  });

  it("builds initials and validates uuids", () => {
    expect(initialsFromName("Isaac Ochoa")).toBe("IO");
    expect(isUuid("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });

  it("formats the header date in Spanish", () => {
    expect(formatHeaderDate(new Date("2026-09-02T12:00:00-05:00"))).toMatch(/septiembre/i);
  });
});
