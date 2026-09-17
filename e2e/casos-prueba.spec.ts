import { expect, test } from "@playwright/test";
import { mockOrbitaApi, TENANT_ID } from "./api-mock";

test("save a test conversation and replay it later", async ({ page }) => {
  test.slow();
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.goto(`/t/${TENANT_ID}/agente`);

  await page.getByRole("button", { name: "Crear mi primer asistente" }).click();
  await page.getByLabel("¿Cómo se llama tu asistente?").fill("Aura");
  await page.getByLabel("¿Cómo habla?").fill("Cercana.");
  await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Atiendes pedidos.");
  await page.getByRole("button", { name: "Crear asistente" }).click();
  await expect(page.getByText(/Creaste a Aura/)).toBeVisible();

  await page.getByRole("tab", { name: "Pruebas" }).click();
  await expect(page.getByText(/guárdala como caso para repetirla/i)).toBeVisible();

  await page.getByLabel("Pregunta de prueba").fill("¿A qué hora abren?");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Abrimos de lunes a sábado, de 7 a 19.")).toBeVisible();

  await page.getByRole("button", { name: "Guardar como caso" }).click();
  await page.getByLabel("¿Cómo lo llamas?").fill("Horario de atención");
  await page.getByRole("button", { name: "Guardar caso" }).click();
  await expect(page.getByText(/Guardamos «Horario de atención»/)).toBeVisible();

  await page.getByRole("button", { name: "Reiniciar" }).click();
  await page.getByRole("button", { name: "Probar de nuevo" }).click();

  await expect(page.getByText("Abrimos de lunes a sábado, de 7 a 19.")).toBeVisible();
  await expect(page.getByText("Igual que cuando guardaste el caso.")).toBeVisible();
});
