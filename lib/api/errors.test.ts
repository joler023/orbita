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
  });

  it("explains ai agent and knowledge errors with what to do next", () => {
    expect(toUserMessage(new ApiError(409, "Cannot delete last agent", "no"))).toBe(
      "No puedes eliminar tu único asistente. Pausa el asistente si no quieres que responda.",
    );
    expect(toUserMessage(new ApiError(413, "Document too large", "no"))).toBe(
      "El archivo pesa más de 25 MB. Divídelo o comprímelo antes de subirlo.",
    );
  });

  it("tells the owner to pause instead of retrying when the assistant has history", () => {
    const message = toUserMessage(new ApiError(409, "Assistant has history", "no"));
    expect(message).toBe(
      "Este asistente ya atendió conversaciones, así que no puedes eliminarlo. Ponlo en pausa si no quieres que siga respondiendo.",
    );
    expect(message).not.toMatch(/int[ée]ntalo de nuevo/i);
  });

  it("detects the two-factor challenge", () => {
    expect(isTwoFactorRequired(new ApiError(401, "Two-factor code required", "need code"))).toBe(
      true,
    );
    expect(isTwoFactorRequired(new ApiError(401, "Invalid credentials", "no"))).toBe(false);
  });
});
