import type { Page } from "@playwright/test";

export const TENANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
export const API_ORIGIN = "http://localhost:5091";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type,accept",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const defaultPipeline = {
  id: "pipe-1",
  name: "Ventas",
  isDefault: true,
  stages: [
    { id: "s1", name: "Nuevo", sortOrder: 0, isWon: false, isLost: false },
    { id: "s2", name: "En conversación", sortOrder: 1, isWon: false, isLost: false },
    { id: "s3", name: "Propuesta", sortOrder: 2, isWon: false, isLost: false },
    { id: "s4", name: "Ganada", sortOrder: 3, isWon: true, isLost: false },
    { id: "s5", name: "Perdida", sortOrder: 4, isWon: false, isLost: true },
  ],
};

export async function mockOrbitaApi(
  page: Page,
  options: {
    meStatus?: number;
    login?: "ok" | "invalid" | "two-factor";
  } = {},
): Promise<void> {
  const meStatus = options.meStatus ?? 401;
  const login = options.login ?? "ok";

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (url.pathname === "/api/auth/me" && method === "GET") {
      if (meStatus === 200) {
        await route.fulfill({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "11111111-1111-1111-1111-111111111111" }),
        });
        return;
      }
      await route.fulfill({
        status: 401,
        headers: corsHeaders,
        body: "",
      });
      return;
    }

    if (url.pathname === "/api/auth/refresh" && method === "POST") {
      await route.fulfill({
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/problem+json" },
        body: JSON.stringify({ title: "Invalid refresh token", detail: "no" }),
      });
      return;
    }

    if (url.pathname === "/api/organizations" && method === "POST") {
      await route.fulfill({
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          tenantSlug: "negocio",
          businessName: "Negocio",
          userId: "11111111-1111-1111-1111-111111111111",
          email: "ana@orbita.test",
          fullName: "Ana Pérez",
        }),
      });
      return;
    }

    if (url.pathname === "/api/auth/login" && method === "POST") {
      if (login === "invalid") {
        await route.fulfill({
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/problem+json" },
          body: JSON.stringify({ title: "Invalid credentials", detail: "no" }),
        });
        return;
      }
      if (login === "two-factor") {
        await route.fulfill({
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/problem+json" },
          body: JSON.stringify({ title: "Two-factor code required", detail: "need code" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "11111111-1111-1111-1111-111111111111",
          email: "ana@orbita.test",
          fullName: "Ana Pérez",
        }),
      });
      return;
    }

    if (url.pathname === `/api/tenants/${TENANT_ID}/pipelines` && method === "GET") {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify([defaultPipeline]),
      });
      return;
    }

    if (url.pathname === `/api/tenants/${TENANT_ID}` && method === "GET") {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: TENANT_ID,
          slug: "negocio",
          name: "Negocio",
          countryCode: "CO",
          timezone: "America/Bogota",
          locale: "es-CO",
          isActive: true,
          createdAt: "2026-09-07T00:00:00Z",
          updatedAt: "2026-09-07T00:00:00Z",
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, headers: corsHeaders, body: "" });
  });
}
