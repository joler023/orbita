import type { Page, Route } from "@playwright/test";

export const TENANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
export const API_ORIGIN = "http://localhost:5091";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type,accept",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

export const SECOND_TENANT_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
export const AGENT_ID = "9b2c3d4e-5f60-4712-8a9b-0c1d2e3f4a5b";

function newAgent(): Record<string, unknown> {
  return {
    id: AGENT_ID,
    name: "Aura",
    personality: "",
    instructions: "",
    style: { formality: "Balanced", verbosity: "Balanced", energy: "Balanced" },
    tools: [],
    guardrails: { blockedTopics: [], outOfScopeReply: "Eso lo ve alguien del equipo." },
    businessHours: null,
    isEnabled: false,
    hasUnpublishedChanges: false,
    draft: null,
    conversationCount: 0,
    createdAt: "2026-09-15T12:00:00.123456+00:00",
  };
}

async function json(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

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

  // The assistant screens read and write, so the mock keeps state for the length of a test.
  let agents: Array<Record<string, unknown>> = [];
  let documents: Array<Record<string, unknown>> = [];
  let routingRules: Array<Record<string, unknown>> = [];
  let testCases: Array<Record<string, unknown>> = [];

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

    if (url.pathname === "/api/ai-tools" && method === "GET") {
      await json(route, [
        {
          key: "consultar_conocimiento",
          displayName: "Consultar los documentos del negocio",
          description: "Busca la respuesta en los documentos que subiste.",
          isAvailable: true,
          unavailableReason: null,
          resultsIn: null,
        },
        {
          key: "crear_oportunidad",
          displayName: "Registrar una oportunidad de venta",
          description: "Crea una oportunidad en el tablero.",
          isAvailable: true,
          unavailableReason: null,
          resultsIn: "pipeline",
        },
      ]);
      return;
    }

    if (url.pathname === `/api/tenants/${TENANT_ID}/routing/rules`) {
      if (method === "PUT") {
        // Reads are a bare array, writes are wrapped: mirrors the real API, asymmetry included.
        routingRules = (request.postDataJSON() as { rules: Record<string, unknown>[] }).rules.map(
          (rule, position) => ({ ...rule, id: `rule-${position + 1}`, position }),
        );
      }
      await json(route, routingRules);
      return;
    }

    const agentsPath = `/api/tenants/${TENANT_ID}/ai-agents`;

    if (url.pathname === agentsPath && method === "GET") {
      await json(route, agents);
      return;
    }

    if (url.pathname === agentsPath && method === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      const created = { ...newAgent(), ...body, id: AGENT_ID };
      agents = [...agents, created];
      await json(route, created, 201);
      return;
    }

    if (url.pathname.startsWith(`${agentsPath}/${AGENT_ID}`)) {
      const rest = url.pathname.slice(`${agentsPath}/${AGENT_ID}`.length);
      const patch = (changes: Record<string, unknown>) => {
        agents = agents.map((agent) =>
          agent.id === AGENT_ID ? { ...agent, ...changes } : agent,
        );
        return agents.find((agent) => agent.id === AGENT_ID);
      };

      if (rest === "" && method === "PATCH") {
        const body = request.postDataJSON() as Record<string, unknown>;
        await json(route, patch({ ...body, hasUnpublishedChanges: true }));
        return;
      }
      if (rest === "/publish" && method === "POST") {
        await json(route, patch({ hasUnpublishedChanges: false, draft: null }));
        return;
      }
      if (rest === "/enabled" && method === "PATCH") {
        const body = request.postDataJSON() as { isEnabled: boolean };
        await json(route, patch({ isEnabled: body.isEnabled }));
        return;
      }
      if (rest === "/business-hours" && method === "PUT") {
        const body = request.postDataJSON() as Record<string, unknown>;
        await json(route, patch({ businessHours: body.businessHours }));
        return;
      }
      if (rest === "/guardrails" && method === "PUT") {
        const body = request.postDataJSON() as Record<string, unknown>;
        await json(route, patch({ guardrails: body }));
        return;
      }
      if (rest === "/knowledge" && method === "GET") {
        await json(route, { items: documents, nextCursor: null });
        return;
      }
      if ((rest === "/knowledge" || rest === "/knowledge/text") && method === "POST") {
        // Indexed straight away: the polling path has its own unit coverage.
        const document = {
          id: `doc-${documents.length + 1}`,
          agentId: AGENT_ID,
          title: "Catálogo",
          sourceType: rest.endsWith("text") ? "Manual" : "Upload",
          status: "Indexed",
          chunkCount: 4,
          failureReason: null,
          indexedAt: "2026-09-15T12:00:00.123456+00:00",
          createdAt: "2026-09-15T12:00:00.123456+00:00",
        };
        documents = [...documents, document];
        await json(route, document, 202);
        return;
      }
      if (rest === "/test-cases" && method === "GET") {
        await json(route, testCases);
        return;
      }
      if (rest === "/test-cases" && method === "POST") {
        const body = request.postDataJSON() as Record<string, unknown>;
        const saved = {
          ...body,
          id: `case-${testCases.length + 1}`,
          createdAt: "2026-09-16T14:57:54.271948+00:00",
        };
        testCases = [...testCases, saved];
        await json(route, saved, 201);
        return;
      }
      if (rest.startsWith("/test-cases/") && method === "DELETE") {
        const id = rest.slice("/test-cases/".length);
        testCases = testCases.filter((testCase) => testCase.id !== id);
        await route.fulfill({ status: 204, headers: corsHeaders, body: "" });
        return;
      }
      if (rest === "/test-chat" && method === "POST") {
        await json(route, {
          reply: "Abrimos de lunes a sábado, de 7 a 19.",
          retrieved: [
            {
              chunkId: "c1",
              documentId: "doc-1",
              documentTitle: "Catálogo",
              chunkIndex: 0,
              content: "Horario: lunes a sábado.",
              score: 0.82,
            },
          ],
          toolCalls: [{ tool: "consultar_conocimiento", summary: "Buscó en Catálogo" }],
          usage: { tokensIn: 900, tokensOut: 120, costUsd: 0.0004, latencyMs: 1400 },
          testedDraft: false,
        });
        return;
      }
    }

    await route.fulfill({ status: 404, headers: corsHeaders, body: "" });
  });
}
