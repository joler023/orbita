import { describe, expect, it } from "vitest";
import {
  ENERGY_AXIS,
  formatAgentsMeta,
  formatConversationCount,
  FORMALITY_AXIS,
  VERBOSITY_AXIS,
} from "./agent-format";

describe("agent formatting", () => {
  it("pluralizes the 30-day conversation count", () => {
    expect(formatConversationCount(1)).toBe("1 conversación en 30 días");
    expect(formatConversationCount(1240)).toBe("1.240 conversaciones en 30 días");
  });

  it("summarizes how many agents are active", () => {
    expect(formatAgentsMeta(2, 1)).toBe("2 asistentes · 1 activo");
    expect(formatAgentsMeta(1, 0)).toBe("1 asistente · 0 activos");
  });

  it("labels the three style axes as Figma does, without model jargon", () => {
    const axes = [FORMALITY_AXIS, VERBOSITY_AXIS, ENERGY_AXIS];

    expect(axes.map((axis) => `${axis.startLabel}–${axis.endLabel}`)).toEqual([
      "Formal–Cercano",
      "Breve–Detallado",
      "Neutro–Entusiasta",
    ]);
    expect(FORMALITY_AXIS.levels).toEqual(["Formal", "Balanced", "Warm"]);
    expect(VERBOSITY_AXIS.levels).toEqual(["Brief", "Balanced", "Detailed"]);
    expect(ENERGY_AXIS.levels).toEqual(["Neutral", "Balanced", "Enthusiastic"]);

    const copy = axes.flatMap((axis) => [axis.startLabel, axis.endLabel, ...axis.levelLabels]).join(" ");
    expect(copy).not.toMatch(/prompt|temperatura|modelo|tokens/i);
  });
});
