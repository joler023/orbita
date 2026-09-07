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
  "Pipeline not found": "No encontramos ese pipeline.",
  "Pipeline stage not found": "No encontramos esa etapa.",
  "Cannot delete last pipeline": "Tiene que quedar al menos un pipeline.",
  "Cannot delete last stage": "Tiene que quedar al menos una etapa.",
  "Stage has opportunities": "Mueve las oportunidades a otra etapa antes de borrar esta.",
  "Pipeline has opportunities": "No se puede borrar un pipeline que todavía tiene oportunidades.",
  "Invalid stage relocate": "Las oportunidades tienen que ir a otra etapa del mismo pipeline.",
  "Opportunity not found": "No encontramos esa oportunidad.",
  "Assignee not in tenant": "Esa persona no es miembro activo de la organización.",
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
