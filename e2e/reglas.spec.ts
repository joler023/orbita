import { expect, test, type Page } from "@playwright/test";
import { mockOrbitaApi, TENANT_ID } from "./api-mock";

async function createAssistant(page: Page) {
  await page.goto(`/t/${TENANT_ID}/agente`);
  await page.getByRole("button", { name: "Crear mi primer asistente" }).click();
  await page.getByLabel("¿Cómo se llama tu asistente?").fill("Aura");
  await page.getByLabel("¿Cómo habla?").fill("Cercana.");
  await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Atiendes pedidos.");
  await page.getByRole("button", { name: "Crear asistente" }).click();
  await expect(page.getByText(/Creaste a Aura/)).toBeVisible();
}

test("routing rules keep the order the owner gives them", async ({ page }) => {
  test.slow();
  await mockOrbitaApi(page, { meStatus: 200 });
  await createAssistant(page);

  await page.getByRole("button", { name: "Reglas de asignación" }).click();
  await expect(page.getByText(/todas las conversaciones llegan a tu equipo/i)).toBeVisible();

  await page.getByRole("button", { name: "Agregar regla" }).click();
  await page.getByLabel("Nombre de la regla 1").fill("Todo al equipo");
  await page.getByLabel("La atiende").last().selectOption("team");

  await page.getByRole("button", { name: "Agregar regla" }).click();
  await page.getByLabel("Nombre de la regla 2").fill("Pedidos");
  await page.getByLabel("Y menciona").last().fill("pedido");

  // A catch-all above another rule swallows it, and the screen says so.
  await expect(page.getByText(/las de abajo nunca se revisan/i)).toBeVisible();

  await page.getByRole("button", { name: "Subir la regla 2" }).click();
  await expect(page.getByLabel("Nombre de la regla 1")).toHaveValue("Pedidos");
  await expect(page.getByText(/las de abajo nunca se revisan/i)).toBeHidden();

  await page.getByRole("button", { name: "Guardar reglas" }).click();
  await expect(page.getByText("Guardamos el orden. Tus conversaciones ya se reparten así.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Reglas de asignación" }).click();
  await expect(page.getByLabel("Nombre de la regla 1")).toHaveValue("Pedidos");
  await expect(page.getByLabel("Nombre de la regla 2")).toHaveValue("Todo al equipo");
});
