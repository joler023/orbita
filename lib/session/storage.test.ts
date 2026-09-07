import { describe, expect, it } from "vitest";
import { readLastTenantId, readSessionUser, writeLastTenantId, writeSessionUser } from "./storage";

describe("session storage", () => {
  it("round-trips the session user and tenant id", () => {
    writeSessionUser({ userId: "u1", email: "ana@orbita.test", fullName: "Ana Pérez" });
    writeLastTenantId("tenant-1");

    expect(readSessionUser()).toEqual({
      userId: "u1",
      email: "ana@orbita.test",
      fullName: "Ana Pérez",
    });
    expect(readLastTenantId()).toBe("tenant-1");
  });
});
