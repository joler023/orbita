import { expect, test, type Page } from "@playwright/test";
import { mockOrbitaApi, TENANT_ID } from "./api-mock";

/**
 * The design guide accepts that the assistant screens are uncomfortable on a phone — only the
 * inbox, the conversation, the board and notifications must be good there. What it does not
 * accept is a broken one, so this walks every Track C screen at phone width and fails if the
 * page scrolls sideways, which is what a squeezed layout ends up doing.
 */
async function expectNoSidewaysScroll(page: Page, screen: string) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, `«${screen}» se sale a lo ancho en celular`).toBeLessThanOrEqual(innerWidth + 1);
}

test("the assistant screens fit a phone", async ({ page }) => {
  test.slow();
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/t/${TENANT_ID}/agente`);

  await expect(page.getByText("Tu asistente atiende mientras tu equipo descansa")).toBeVisible();
  await expectNoSidewaysScroll(page, "2.5 sin asistentes");

  await page.getByRole("button", { name: "Crear mi primer asistente" }).click();
  await page.getByLabel("¿Cómo se llama tu asistente?").fill("Aura");
  await page.getByLabel("¿Cómo habla?").fill("Cercana y directa.");
  await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Atiendes pedidos de la panadería.");
  await expectNoSidewaysScroll(page, "2.6 asistente nuevo");
  await page.getByRole("button", { name: "Crear asistente" }).click();
  await expect(page.getByText(/Creaste a Aura/)).toBeVisible();

  for (const tab of [
    "Herramientas",
    "Horario",
    "Límites",
    "Respuestas repetidas",
    "Conocimiento",
    "Pruebas",
  ] as const) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
    if (tab === "Horario") {
      // The week only renders once the owner picks the schedule, and it is the widest thing here.
      await page.getByRole("radio", { name: /Solo fuera del horario laboral/ }).check();
      await expect(page.getByLabel("Lunes: abre")).toBeVisible();
    }
    await expectNoSidewaysScroll(page, `2.6 · ${tab}`);
  }

  await page.getByRole("button", { name: "Conversaciones en espera" }).click();
  await expect(page.getByText("Laura Gómez")).toBeVisible();
  await expectNoSidewaysScroll(page, "conversaciones en espera");

  await page.getByRole("button", { name: "Reglas de asignación" }).click();
  await page.getByRole("button", { name: "Agregar regla" }).click();
  await page.getByLabel("Nombre de la regla 1").fill("Pedidos por WhatsApp");
  await expectNoSidewaysScroll(page, "reglas de asignación");

  await page.getByRole("button", { name: "Modelos de IA" }).click();
  await page.getByRole("button", { name: "Descartar y seguir" }).click();
  await expect(page.getByLabel("Modelo para escribir la respuesta")).toBeVisible();
  await expectNoSidewaysScroll(page, "modelos de IA");
});
