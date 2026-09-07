import { describe, expect, it } from "vitest";
import { ApiError, isTwoFactorRequired, toUserMessage } from "./errors";

describe("toUserMessage", () => {
  it("maps known API titles to Spanish copy", () => {
    expect(toUserMessage(new ApiError(401, "Invalid credentials", "no"))).toBe(
      "El correo o la contraseña no coinciden.",
    );
    expect(toUserMessage(new ApiError(409, "Email already registered", "no"))).toBe(
      "Este correo ya tiene una cuenta.",
    );
    expect(toUserMessage(new ApiError(409, "Stage has opportunities", "no"))).toBe(
      "Mueve las oportunidades a otra etapa antes de borrar esta.",
    );
  });

  it("detects the two-factor challenge", () => {
    expect(isTwoFactorRequired(new ApiError(401, "Two-factor code required", "need code"))).toBe(
      true,
    );
    expect(isTwoFactorRequired(new ApiError(401, "Invalid credentials", "no"))).toBe(false);
  });
});
