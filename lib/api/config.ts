export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) {
    throw new Error("Falta la variable NEXT_PUBLIC_API_BASE_URL.");
  }
  return value.replace(/\/$/, "");
}
