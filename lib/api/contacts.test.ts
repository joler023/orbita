import { describe, expect, it } from "vitest";
import { formatContactActivity, formatContactChannel } from "./contacts";

describe("contact formatters", () => {
  it("labels known channels in Spanish", () => {
    expect(formatContactChannel("whatsapp")).toBe("WhatsApp");
    expect(formatContactChannel("instagram")).toBe("Instagram");
    expect(formatContactChannel("unknown")).toBe("Sin canal");
  });

  it("formats last activity in es-CO", () => {
    expect(formatContactActivity("2026-09-07T18:00:00Z")).toMatch(/sept/i);
  });
});
