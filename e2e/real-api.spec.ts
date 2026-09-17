import { expect, test, type Page } from "@playwright/test";

/**
 * Runs the dashboard against a live API instead of the mocks in api-mock.ts. The mocks are a
 * hypothesis about the other end; this is the check that the hypothesis still holds.
 *
 * Skipped unless ORBITA_REAL_API=1, so the normal suite and CI never depend on a running API.
 * Needs an account that owns one organization and is a Viewer in another, e.g. the seeded
 * demo user. It reuses one assistant named «[prueba front] no usar» and restores the routing
 * rules it touches, so running it again adds nothing to shared data.
 *
 *   ORBITA_REAL_API=1 ORBITA_E2E_EMAIL=... ORBITA_E2E_PASSWORD=... bun run test:e2e real-api
 */
const enabled = process.env.ORBITA_REAL_API === "1";
const email = process.env.ORBITA_E2E_EMAIL ?? "";
const password = process.env.ORBITA_E2E_PASSWORD ?? "";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5091";

test.describe("against the real API", () => {
  test.skip(!enabled, "set ORBITA_REAL_API=1 with a running API to run these");
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  // One fixed assistant reused on every run. Testing gives it history, and an assistant with
  // history cannot be deleted, so a fresh one per run would pile up in shared data forever.
  const assistantName = "[prueba front] no usar";
  const assistantButton = /^\[prueba front\] no usar/;

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Correo").fill(email);
    await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/t\/[0-9a-f-]+\/inicio/);
  }

  /**
   * Moves to an organization through the switcher. Waits for that organization's own URL, not
   * just any /inicio: both organizations have one, so a looser check passes before the move.
   */
  async function switchTo(page: Page, organization: string) {
    const trigger = page.getByRole("button", { name: /Panadería La Espiga|Clínica Sonrisa/ });
    if (((await trigger.textContent()) ?? "").includes(organization)) {
      return;
    }
    await trigger.click();
    const link = page.getByRole("link", { name: organization });
    const href = (await link.getAttribute("href")) ?? "";
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("button", { name: organization })).toBeVisible();
  }

  async function openOwnedAgentScreen(page: Page) {
    await switchTo(page, "Panadería La Espiga");
    await page.getByRole("link", { name: "Agente IA" }).click();
    await expect(page.getByRole("navigation", { name: "Asistentes" })).toBeVisible();
  }

  test("signs in with real memberships and moves between organizations", async ({ page }) => {
    await signIn(page);

    await switchTo(page, "Panadería La Espiga");
    await switchTo(page, "Clínica Sonrisa");
    await switchTo(page, "Panadería La Espiga");
  });

  test("a Viewer is told whom to ask instead of seeing an error", async ({ page }) => {
    await signIn(page);
    await switchTo(page, "Clínica Sonrisa");
    await page.getByRole("link", { name: "Agente IA" }).click();

    await expect(page.getByText("Necesitas permiso de administrador")).toBeVisible();
  });

  test("configures the test assistant end to end and every change survives a reload", async ({ page }) => {
    await signIn(page);
    await openOwnedAgentScreen(page);

    const existing = page.getByRole("button", { name: assistantButton });
    if ((await existing.count()) > 0) {
      await existing.click();
    } else {
      await page.getByRole("button", { name: "Nuevo asistente" }).click();
      await page.getByLabel("¿Cómo se llama tu asistente?").fill(assistantName);
      await page.getByLabel("¿Cómo habla?").fill("Asistente de prueba del dashboard.");
      await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Respondes corto. Es una prueba automática.");
      await page.getByRole("button", { name: "Crear asistente" }).click();
      await expect(page.getByText(`Creaste a ${assistantName}. Queda en pausa hasta que lo actives.`)).toBeVisible();
    }

    // The assistant is reused, so every step starts from a known state instead of from
    // whatever the previous run left: back to "always" first, which also covers sending null.
    await page.getByRole("tab", { name: "Horario" }).click();
    await page.getByRole("radio", { name: /Siempre/ }).check();
    await page.getByRole("button", { name: "Guardar horario" }).click();
    await expect(page.getByText("Listo. Tu asistente atiende a cualquier hora.")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: assistantButton }).click();
    await page.getByRole("tab", { name: "Horario" }).click();
    await page.getByRole("radio", { name: /Solo fuera del horario laboral/ }).check();
    await expect(page.getByLabel("Lunes: abre")).toHaveCount(1);
    await page.getByRole("button", { name: "Agregar franja el lunes" }).click();
    await page.getByLabel("Lunes: abre").nth(1).fill("14:00");
    await page.getByLabel("Lunes: cierra").nth(1).fill("18:00");
    await page.getByLabel("Lunes: cierra").first().fill("12:00");
    await page.getByRole("button", { name: "Guardar horario" }).click();
    await expect(page.getByText("Listo. Tu asistente atiende fuera de tu horario.")).toBeVisible();

    await page.getByRole("tab", { name: "Límites" }).click();
    const leftoverTopic = page.getByRole("button", { name: "Quitar mayoreo" });
    if ((await leftoverTopic.count()) > 0) {
      await leftoverTopic.click();
      await page.getByRole("button", { name: "Guardar límites" }).click();
      await expect(page.getByText("Listo. Tu asistente ya respeta estos límites.")).toBeVisible();
    }
    await page.getByLabel(/no hable/).fill("mayoreo");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Guardar límites" }).click();
    await expect(page.getByText("Listo. Tu asistente ya respeta estos límites.").last()).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: assistantButton }).click();

    await page.getByRole("tab", { name: "Horario" }).click();
    await expect(page.getByRole("radio", { name: /Solo fuera del horario laboral/ })).toBeChecked();
    await expect(page.getByLabel("Lunes: abre")).toHaveCount(2);
    await expect(page.getByLabel("Lunes: cierra").first()).toHaveValue("12:00");
    await expect(page.getByLabel("Lunes: abre").nth(1)).toHaveValue("14:00");

    await page.getByRole("tab", { name: "Límites" }).click();
    await expect(page.getByText("mayoreo", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Herramientas" }).click();
    await expect(
      page.getByRole("checkbox", { name: /Registrar una oportunidad/ }),
    ).toHaveAccessibleDescription(/todavía no puedes abrir desde el panel/);
    await expect(page.getByRole("checkbox", { name: /Agendar una cita/ })).toBeDisabled();

    await page.getByRole("tab", { name: "Pruebas" }).click();
    await page.getByLabel("Pregunta de prueba").fill("¿A qué hora abren?");
    await page.keyboard.press("Enter");
    // Saving becomes possible only once a real answer is on screen and nothing is pending.
    await expect(page.getByRole("button", { name: "Guardar como caso" })).toBeEnabled({ timeout: 90_000 });

    await page.getByRole("button", { name: "Guardar como caso" }).click();
    await page.getByLabel("¿Cómo lo llamas?").fill("Horario, prueba e2e");
    await page.getByRole("button", { name: "Guardar caso" }).click();
    await expect(page.getByText(/Guardamos «Horario, prueba e2e»/)).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: assistantButton }).click();
    await page.getByRole("tab", { name: "Pruebas" }).click();
    await expect(page.getByText("Horario, prueba e2e").first()).toBeVisible();
    await page.getByRole("button", { name: "Probar de nuevo" }).first().click();
    await expect(
      page.getByText(/Al guardar el caso respondió:|Igual que cuando guardaste el caso\./),
    ).toBeVisible({ timeout: 90_000 });
    // The list is loaded by now, so the count is real. Also removes leftovers of a failed run.
    const mine = page.getByRole("button", { name: "Eliminar el caso Horario, prueba e2e" });
    for (let remaining = await mine.count(); remaining > 0; remaining -= 1) {
      await mine.first().click();
      await expect(mine).toHaveCount(remaining - 1);
    }

    // The assistant now has history, so the API refuses to delete it and the screen says why.
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page.getByRole("button", { name: "Eliminar asistente" }).click();
    await expect(
      page.getByText(
        "Este asistente ya atendió conversaciones, así que no puedes eliminarlo. Ponlo en pausa si no quieres que siga respondiendo.",
      ),
    ).toBeVisible();
  });

  test("routing rules save in order against the real API and are restored", async ({ page }) => {
    await signIn(page);
    await openOwnedAgentScreen(page);
    await page.getByRole("button", { name: "Reglas de asignación" }).click();

    // Count only once the rules have loaded: during the skeleton the count is 0 even on an
    // organization that has rules, and this test would then overwrite them.
    await expect(page.getByText(/gana la primera que coincida/)).toBeVisible();
    const before = await page.getByLabel(/^Nombre de la regla \d+$/).count();
    test.skip(before > 0, "the organization already has rules; this test only runs on an empty list");

    const rulesUrl = `${apiBase}${new URL(page.url()).pathname.replace(/^\/t\/([^/]+)\/.*$/, "/api/tenants/$1/routing/rules")}`;

    try {
      await page.getByRole("button", { name: "Agregar regla" }).click();
      await page.getByLabel("Nombre de la regla 1").fill("Reclamos al equipo");
      await page.getByLabel("Y menciona").first().fill("reclamo");
      await page.getByLabel("La atiende").first().selectOption("team");
      await page.getByRole("button", { name: "Agregar regla" }).click();
      await page.getByLabel("Nombre de la regla 2").fill("Pedidos");
      await page.getByLabel("Y menciona").nth(1).fill("pedido");
      await page.getByRole("button", { name: "Subir la regla 2" }).click();
      await page.getByRole("button", { name: "Guardar reglas" }).click();
      await expect(page.getByText("Guardamos el orden. Tus conversaciones ya se reparten así.")).toBeVisible();

      await page.reload();
      await page.getByRole("button", { name: "Reglas de asignación" }).click();
      await expect(page.getByLabel("Nombre de la regla 1")).toHaveValue("Pedidos");
      await expect(page.getByLabel("Nombre de la regla 2")).toHaveValue("Reclamos al equipo");

      await page.getByRole("button", { name: "Eliminar la regla 2" }).click();
      await page.getByRole("button", { name: "Eliminar la regla 1" }).click();
      // Before saving, the screen must not claim the team already gets everything.
      await expect(page.getByText(/Quitaste todas las reglas\. Cuando guardes/)).toBeVisible();
      await page.getByRole("button", { name: "Guardar reglas" }).click();
      await expect(page.getByText("Guardamos el orden. Tus conversaciones ya se reparten así.")).toBeVisible();

      await page.reload();
      await page.getByRole("button", { name: "Reglas de asignación" }).click();
      await expect(page.getByText(/así que todas las conversaciones llegan a tu equipo/)).toBeVisible();
    } finally {
      // Shared data: leave the organization as it was even if an assertion above failed.
      const restored = await page.request.put(rulesUrl, {
        data: { rules: [] },
        headers: { Origin: "http://localhost:3000" },
      });
      expect(restored.ok(), `restoring the routing rules answered ${restored.status()}`).toBe(true);
    }
  });
});
