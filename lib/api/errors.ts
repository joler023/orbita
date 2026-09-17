export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;

  constructor(status: number, title: string, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
  }
}

const TITLE_COPY: Record<string, string> = {
  "Invalid credentials": "El correo o la contraseña no coinciden.",
  "Two-factor code required": "Necesitamos el código de verificación en dos pasos.",
  "Email already registered": "Este correo ya tiene una cuenta.",
  "Invalid refresh token": "Tu sesión expiró. Vuelve a entrar.",
  "Invalid password reset": "El enlace para cambiar la contraseña ya no sirve. Pide uno nuevo.",
  Forbidden: "No tienes permiso para esta acción.",
  "AI agent not found": "Ese asistente ya no existe. Puede que alguien lo haya eliminado.",
  "Cannot delete last agent": "No puedes eliminar tu único asistente. Pausa el asistente si no quieres que responda.",
  // Keyed by title on purpose: the API pins this title so renaming it cannot degrade the copy.
  "Too many test cases": "Este asistente ya tiene 20 casos de prueba guardados. Elimina alguno para guardar otro.",
  "Assistant has history":
    "Este asistente ya atendió conversaciones, así que no puedes eliminarlo. Ponlo en pausa si no quieres que siga respondiendo.",
  "Knowledge document not found": "Ese documento ya no existe. Recarga la lista.",
  "Unsupported document type": "Ese tipo de archivo no se puede subir. Usa PDF, DOCX, TXT o MD.",
  "Document too large": "El archivo pesa más de 25 MB. Divídelo o comprímelo antes de subirlo.",
  "Empty upload": "El archivo está vacío. Elige otro.",
  "Model provider unavailable": "El asistente no pudo responder ahora mismo. Inténtalo de nuevo en un momento.",
  "Invitation not found": "Esa invitación ya no existe. Puede que ya se haya usado o revocado.",
  "Invalid invitation": "Este enlace de invitación ya no es válido. Pide uno nuevo.",
  "Member not found": "Esa persona ya no está en el equipo. Recarga la lista.",
  "Cannot remove last owner": "No puedes dejar la organización sin un dueño. Asigna el rol de dueño a otra persona primero.",
  "Membership already exists": "Esa persona ya pertenece a tu equipo.",
  "Plan not found": "Ese plan ya no está disponible.",
  "Subscription not found": "No encontramos una suscripción activa.",
  "Subscription already exists": "Tu organización ya tiene un plan contratado.",
  "Unexpected error": "Algo salió mal. Inténtalo de nuevo en un momento.",
};

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return TITLE_COPY[error.title] ?? "No pudimos completar esta acción. Inténtalo de nuevo.";
  }
  return "No pudimos conectar con el servidor. Revisa tu conexión.";
}

export function isTwoFactorRequired(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && error.title === "Two-factor code required";
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const fallbackTitle = response.status === 401 ? "Invalid credentials" : "Unexpected error";
  try {
    const body: unknown = await response.json();
    if (isProblemDetails(body)) {
      return new ApiError(
        response.status,
        body.title ?? fallbackTitle,
        body.detail ?? body.title ?? fallbackTitle,
      );
    }
  } catch {
    // Non-JSON bodies still become a typed API error.
  }
  return new ApiError(response.status, fallbackTitle, fallbackTitle);
}

function isProblemDetails(value: unknown): value is { title?: string; detail?: string } {
  return typeof value === "object" && value !== null;
}
