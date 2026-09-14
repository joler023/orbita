import { describe, expect, it } from "vitest";
import { emptyAgentDraft, hasDraftErrors, isSameDraft, normalizeDraft, validateAgentDraft } from "./agent-draft";

describe("agent draft", () => {
  it("asks for every required field in plain language", () => {
    const errors = validateAgentDraft({ ...emptyAgentDraft(), name: "   " });

    expect(errors).toEqual({
      name: "Ponle un nombre a tu asistente.",
      personality: "Describe cómo habla tu asistente.",
      instructions: "Cuéntale a tu asistente qué hace y qué nunca debe hacer.",
    });
    expect(hasDraftErrors(errors)).toBe(true);
  });

  it("explains the length limit with the current count", () => {
    const errors = validateAgentDraft({
      ...emptyAgentDraft(),
      name: "x".repeat(121),
      personality: "Cercana",
      instructions: "Atiende pedidos",
    });

    expect(errors).toEqual({ name: "Usa como máximo 120 caracteres. Ahora tiene 121." });
  });

  it("passes a complete draft", () => {
    const errors = validateAgentDraft({
      ...emptyAgentDraft(),
      name: "Aura",
      personality: "Cercana",
      instructions: "Atiende pedidos",
    });

    expect(hasDraftErrors(errors)).toBe(false);
  });

  it("compares tools as a set", () => {
    const a = { ...emptyAgentDraft(), tools: ["x", "y"] };
    expect(isSameDraft(a, { ...a, tools: ["y", "x"] })).toBe(true);
    expect(isSameDraft(a, { ...a, tools: ["x"] })).toBe(false);
    expect(isSameDraft(a, { ...a, style: { ...a.style, formality: "Formal" } })).toBe(false);
  });

  it("trims text before saving", () => {
    expect(normalizeDraft({ ...emptyAgentDraft(), name: "  Aura " }).name).toBe("Aura");
  });
});
