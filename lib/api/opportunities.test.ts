import { describe, expect, it } from "vitest";
import { formatOpportunityAmount } from "./opportunities";

describe("formatOpportunityAmount", () => {
  it("formats COP without cents and labels a missing amount", () => {
    expect(formatOpportunityAmount(null)).toBe("Sin monto");
    expect(formatOpportunityAmount(1500)).toMatch(/1.500|1,500/);
  });
});
