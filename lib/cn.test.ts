import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("px-2", false, "py-1", undefined, "rounded-xl")).toBe("px-2 py-1 rounded-xl");
  });
});
