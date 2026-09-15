export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("Falta la variable NEXT_PUBLIC_API_BASE_URL.");
  }
  return value.replace(/\/$/, "");
}

/**
 * Unset until the Meta app exists (ORB-B01's "connect a real app" step, see CLAUDE.md's
 * Channels section) — `null` means "show the not-configured-yet state", not an error,
 * since most of the codebase can and does work before a Meta app is created.
 */
export function getMetaAppId(): string | null {
  return process.env.NEXT_PUBLIC_META_APP_ID?.trim() || null;
}

export function getMetaConfigId(): string | null {
  return process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID?.trim() || null;
}
