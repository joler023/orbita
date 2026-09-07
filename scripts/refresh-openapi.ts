/**
 * Refresh the committed OpenAPI snapshot from a running Orbita API.
 * Usage: bun scripts/refresh-openapi.ts [baseUrl]
 */
export {};

const defaultBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5091";
const baseUrl = (process.argv[2] ?? defaultBaseUrl).replace(/\/$/, "");
const source = `${baseUrl}/openapi/v1.json`;

const response = await fetch(source);
if (!response.ok) {
  throw new Error(`No se pudo leer OpenAPI desde ${source}: ${response.status}`);
}

const spec = await response.text();
await import("node:fs/promises").then(({ writeFile }) =>
  writeFile("openapi/orbita.json", spec.endsWith("\n") ? spec : `${spec}\n`),
);
console.log(`Wrote openapi/orbita.json from ${source}`);
