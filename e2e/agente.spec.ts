import { expect, test } from "@playwright/test";
import { mockOrbitaApi, SECOND_TENANT_ID, TENANT_ID } from "./api-mock";

const agentePath = `/t/${TENANT_ID}/agente`;

test("sells the feature before asking anyone to configure it", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.goto(agentePath);

  await expect(page.getByText("Tu asistente atiende mientras tu equipo descansa")).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear mi primer asistente" })).toBeVisible();
});

test("create, configure, feed and try an assistant, then publish it", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.goto(agentePath);

  await page.getByRole("button", { name: "Crear mi primer asistente" }).click();
  await page.getByLabel("¿Cómo se llama tu asistente?").fill("Aura");
  await page.getByLabel("¿Cómo habla?").fill("Cercana y directa.");
  await page
    .getByLabel("¿Qué hace y qué nunca debe hacer?")
    .fill("Atiendes pedidos de la panadería. Nunca das precios de mayoreo.");
  await page.getByRole("button", { name: "Crear asistente" }).click();

  await expect(page.getByText("Creaste a Aura. Queda en pausa hasta que lo actives.")).toBeVisible();

  await page.getByRole("tab", { name: "Herramientas" }).click();
  await expect(
    page.getByRole("checkbox", { name: /Registrar una oportunidad/ }),
  ).toHaveAccessibleDescription(/todavía no puedes abrir desde el panel/);

  await page.getByRole("tab", { name: "Horario" }).click();
  await page.getByRole("radio", { name: /Solo fuera del horario laboral/ }).check();
  await page.getByLabel("Lunes: abre").fill("07:00");
  await page.getByRole("button", { name: "Guardar horario" }).click();
  await expect(page.getByText("Listo. Tu asistente atiende fuera de tu horario.")).toBeVisible();

  await page.getByRole("tab", { name: "Límites" }).click();
  await expect(page.getByText(/empieza a regir apenas lo guardes/)).toBeVisible();
  await page.getByLabel(/no hable/).fill("mayoreo");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Guardar límites" }).click();
  await expect(page.getByText("Listo. Tu asistente ya respeta estos límites.")).toBeVisible();

  await page.getByRole("tab", { name: "Conocimiento" }).click();
  await page.getByRole("button", { name: "Pegar texto" }).click();
  await page.getByLabel("¿Qué es este texto?").fill("Catálogo");
  await page.getByLabel("Texto", { exact: true }).fill("Horario: lunes a sábado, de 7 a 19.");
  await page.getByRole("button", { name: "Agregar" }).click();
  // Exact: the panel's own blurb also mentions a catálogo.
  await expect(page.getByText("Catálogo", { exact: true })).toBeVisible();

  await page.getByRole("tab", { name: "Pruebas" }).click();
  await page.getByRole("textbox").last().fill("¿A qué hora abren?");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Abrimos de lunes a sábado, de 7 a 19.")).toBeVisible();
  await expect(page.getByText(/Catálogo/).first()).toBeVisible();

  // A brand new assistant has nothing to publish yet, so the owner edits, saves, publishes.
  await page.getByRole("tab", { name: "Instrucciones" }).click();
  await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Atiendes pedidos. Nunca das precios de mayoreo.");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(
    page.getByText("Guardado sin publicar: tus clientes siguen viendo la versión anterior."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Publicamos los cambios. Tus clientes ya ven esta versión.")).toBeVisible();
});

test("the limits tab never offers two different saves", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.goto(agentePath);

  await page.getByRole("button", { name: "Crear mi primer asistente" }).click();
  await page.getByLabel("¿Cómo se llama tu asistente?").fill("Aura");
  await page.getByLabel("¿Cómo habla?").fill("Cercana.");
  await page.getByLabel("¿Qué hace y qué nunca debe hacer?").fill("Atiendes pedidos.");
  await page.getByRole("button", { name: "Crear asistente" }).click();

  await expect(page.getByRole("button", { name: "Publicar" })).toBeVisible();
  await page.getByRole("tab", { name: "Límites" }).click();
  await expect(page.getByRole("button", { name: "Publicar" })).toBeHidden();
});

test("someone in two organizations can move between them", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200, secondOrganization: true });
  await page.goto(`/t/${TENANT_ID}/inicio`);

  await page.getByRole("button", { name: /Negocio/ }).click();
  await page.getByRole("link", { name: "Clínica Sonrisa" }).click();

  await expect(page).toHaveURL(new RegExp(`/t/${SECOND_TENANT_ID}/inicio`));
});
