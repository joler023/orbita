import type { Page } from "@playwright/test";

export const TENANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
export const API_ORIGIN = "http://localhost:5091";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type,accept",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

export const SECOND_TENANT_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

export async function mockOrbitaApi(
  page: Page,
  options: {
    meStatus?: number;
    login?: "ok" | "invalid" | "two-factor";
    /** Add the second organization to test moving between them. */
    secondOrganization?: boolean;
  } = {},
): Promise<void> {
  const meStatus = options.meStatus ?? 401;
  const login = options.login ?? "ok";

  const memberships = [
    { tenantId: TENANT_ID, slug: "negocio", name: "Negocio", role: "Owner" },
    ...(options.secondOrganization
      ? [{ tenantId: SECOND_TENANT_ID, slug: "clinica", name: "Clínica Sonrisa", role: "Viewer" }]
      : []),
  ];

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
          body: JSON.stringify({
            userId: "11111111-1111-1111-1111-111111111111",
            email: "ana@orbita.test",
            fullName: "Ana Pérez",
            memberships,
          }),
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
