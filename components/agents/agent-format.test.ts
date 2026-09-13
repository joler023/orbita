import { describe, expect, it } from "vitest";
import { formatAgentsMeta, formatConversationCount, TONE_OPTIONS } from "./agent-format";

describe("agent formatting", () => {
  it("pluralizes the 30-day conversation count", () => {
    expect(formatConversationCount(1)).toBe("1 conversación en 30 días");
    expect(formatConversationCount(1240)).toBe("1.240 conversaciones en 30 días");
  });

  it("summarizes how many agents are active", () => {
    expect(formatAgentsMeta(2, 1)).toBe("2 asistentes · 1 activo");
    expect(formatAgentsMeta(1, 0)).toBe("1 asistente · 0 activos");
  });

  it("offers the three tones without model jargon", () => {
    const copy = TONE_OPTIONS.map((option) => `${option.title} ${option.description}`).join(" ");
    expect(TONE_OPTIONS.map((option) => option.value)).toEqual(["Formal", "Balanced", "Conversational"]);
    expect(copy).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
