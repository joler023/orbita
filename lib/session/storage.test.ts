import { beforeEach, describe, expect, it } from "vitest";
import { clearLocalSession, readLastTenantId, writeLastTenantId } from "./storage";

describe("session storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("remembers the organization used last", () => {
    expect(readLastTenantId()).toBeNull();

    writeLastTenantId("tenant-1");
    expect(readLastTenantId()).toBe("tenant-1");
  });

  it("forgets it when the session ends", () => {
    writeLastTenantId("tenant-1");

    clearLocalSession();

    expect(readLastTenantId()).toBeNull();
  });
});
