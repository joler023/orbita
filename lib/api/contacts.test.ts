import { describe, expect, it } from "vitest";
import { formatContactActivity, formatContactChannel, formatRelativeActivity } from "./contacts";

describe("contact formatters", () => {
  it("labels known channels in Spanish", () => {
    expect(formatContactChannel("whatsapp")).toBe("WhatsApp");
    expect(formatContactChannel("instagram")).toBe("Instagram");
    expect(formatContactChannel("unknown")).toBe("Sin canal");
  });

  it("formats last activity in es-CO", () => {
    expect(formatContactActivity("2026-09-07T18:00:00Z")).toMatch(/sept/i);
  });

  it("formats recent activity the way the contact list does", () => {
    const now = new Date("2026-09-07T18:04:00Z");
    expect(formatRelativeActivity("2026-09-07T18:00:00Z", now)).toBe("hace 4 min");
  });
});
