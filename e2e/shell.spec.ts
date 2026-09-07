import { expect, test } from "@playwright/test";
import { mockOrbitaApi, TENANT_ID } from "./api-mock";

test("unauthenticated dashboard visits go to login", async ({ page }) => {
  await mockOrbitaApi(page);
  await page.goto(`/t/${TENANT_ID}/inicio`);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("login shows Spanish copy for invalid credentials", async ({ page }) => {
  await mockOrbitaApi(page, { login: "invalid" });
  await page.goto("/login");
  await page.getByLabel("Correo").fill("ana@orbita.test");
  await page.getByLabel("Contraseña").fill("secretsecret");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("El correo o la contraseña no coinciden.")).toBeVisible();
});

test("register then login lands on Inicio", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 401 });
  await page.goto("/registro");
  await page.getByLabel("Nombre del negocio").fill("Negocio");
  await page.getByLabel("Tu nombre").fill("Ana Pérez");
  await page.getByLabel("Correo").fill("ana@orbita.test");
  await page.getByLabel("Contraseña").fill("secretsecret");

  await mockOrbitaApi(page, { meStatus: 200 });
  await page.getByRole("button", { name: "Crear organización" }).click();

  await expect(page).toHaveURL(new RegExp(`/t/${TENANT_ID}/inicio`));
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await expect(page.getByText("Sin responder")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bandeja" })).toBeVisible();
});

test("pipeline page shows the default sales stages", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.goto(`/t/${TENANT_ID}/pipeline`);
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ventas/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nuevo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ganada" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sitio web" })).toBeVisible();
});

test("mobile nav opens the drawer", async ({ page }) => {
  await mockOrbitaApi(page, { meStatus: 200 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/t/${TENANT_ID}/inicio`);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("link", { name: "Bandeja" })).toBeVisible();
});
