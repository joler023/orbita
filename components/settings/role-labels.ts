import type { MemberRole } from "@/lib/api/auth";

/**
 * Guía de pantallas 3.8: "explicar los roles con palabras, no con nombres" — a role
 * name alone ("Agente") doesn't tell someone what they're granting. Pair it with what
 * the role can and can't do every time it's shown to a person picking one.
 */
export const ROLE_LABEL: Record<MemberRole, string> = {
  Owner: "Dueño",
  Admin: "Administrador",
  Agent: "Agente",
  Viewer: "Solo lectura",
};

export const ROLE_DESCRIPTION: Record<MemberRole, string> = {
  Owner: "Controla todo, incluida la facturación. Solo puede haber al menos uno.",
  Admin: "Configura canales, equipo y asistentes, pero no la facturación.",
  Agent: "Puede atender conversaciones y gestionar ventas, pero no cambiar la configuración.",
  Viewer: "Solo puede ver conversaciones y reportes, sin hacer cambios.",
};

export const ASSIGNABLE_ROLES: readonly MemberRole[] = ["Owner", "Admin", "Agent", "Viewer"];
