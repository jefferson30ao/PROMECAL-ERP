import { test, expect } from "@playwright/test";
import { resources } from "../packages/domain/catalog";
test("consumo de inventario se refleja en stock y costo por servicio", async ({
  page,
}) => {
  await page.goto("/#/modulos/logistica/movements?new=1");
  const form = page.getByRole("dialog");
  await form.getByLabel("Referencia / motivo").fill("Consumo de prueba");
  await form.getByLabel("Repuesto", { exact: true }).selectOption("REP-003");
  await form.getByLabel("Movimiento", { exact: true }).selectOption("Consumo");
  await form.getByLabel("Cantidad", { exact: true }).fill("1");
  await form
    .getByLabel("Orden (obligatoria para consumo)")
    .selectOption("OT-2026-0044");
  await form.getByRole("button", { name: "Guardar registro" }).click();
  await expect(form).not.toBeVisible();
  await page.goto("/#/modulos/finanzas/costs?q=Consumo");
  await expect(
    page.getByRole("button", { name: /Consumo · Módulo IGBT/ }),
  ).toBeVisible();
});
test("garantía cubierta abre atención de monto cero vinculada", async ({
  page,
}) => {
  await page.goto("/#/modulos/comercial/warranties");
  await page
    .getByRole("button", { name: /Evaluación de falla recurrente/ })
    .click();
  await page.getByRole("button", { name: "Editar registro" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Estado", { exact: true })
    .selectOption("Cubierta");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await page
    .getByRole("button", { name: /Evaluación de falla recurrente/ })
    .click();
  await page.getByRole("button", { name: "Crear atención cubierta" }).click();
  await expect(page).toHaveURL(/ordenes\/OT-GAR/);
  await expect(
    page.getByRole("heading", { name: /Garantía · Variador/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Comercial", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Atención de garantía/ }),
  ).toBeVisible();
});
test("panel y navegación de todos los módulos y recursos sin errores", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Una visión clara de tu operación." }),
  ).toBeVisible();
  for (const r of resources) {
    await page.goto(`/#/modulos/${r.module}/${r.key}`);
    await expect(
      page.getByRole("heading", { name: r.title, exact: true }),
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("cliente nuevo persiste al recargar y puede editarse", async ({
  page,
}) => {
  await page.goto("/#/modulos/comercial/clients");
  await page
    .getByRole("button", { name: "Nuevo registro", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Razón social / nombre")
    .fill("Empresa de prueba E2E");
  await dialog.getByLabel("N.º de documento").fill("20987654321");
  await dialog.getByLabel("Persona de contacto").fill("Ana Prueba");
  await dialog.getByLabel("Correo").fill("ana@example.com");
  await dialog.getByLabel("Teléfono").fill("999999999");
  await dialog.getByLabel("Dirección").fill("Lima");
  await dialog.getByRole("button", { name: "Guardar registro" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page
    .getByRole("textbox", { name: "Buscar registros" })
    .fill("Empresa de prueba E2E");
  await page.getByRole("button", { name: /Empresa de prueba E2E/ }).click();
  await page.getByRole("button", { name: "Editar registro" }).click();
  await page.getByLabel("Persona de contacto").fill("Ana Actualizada");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Actualización guardada",
  );
});
test("búsqueda, filtro y estado vacío", async ({ page }) => {
  await page.goto("/#/modulos/operaciones/orders");
  await page.getByLabel("Filtrar por estado").selectOption("En revisión");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Buscar registros").fill("no-existe-123");
  await expect(
    page.getByRole("heading", { name: "No hay registros para mostrar." }),
  ).toBeVisible();
});
test("revisión con firma libera certificado y registra historial", async ({
  page,
}) => {
  await page.goto("/#/ordenes/OS-2026-0042");
  await expect(
    page.getByRole("button", { name: "Liberar documento" }),
  ).toBeDisabled();
  await page.getByLabel("Resultados revisados").check();
  await page.getByLabel("Registrar firma").check();
  await expect(
    page.getByRole("button", { name: "Liberar documento" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Liberar documento" }).click();
  await expect(
    page.getByRole("heading", { name: "Datos de entrega" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Certificado de calibración/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Historial", exact: true }).click();
  await expect(page.getByText("Orden liberada", { exact: true })).toBeVisible();
});
test("conciliación habilita control financiero y despacho permanece sujeto a factura", async ({
  page,
}) => {
  await page.goto("/#/ordenes/OS-2026-0047");
  await expect(
    page.getByRole("button", { name: "Confirmar despacho" }),
  ).toBeDisabled();
  await page.goto("/#/modulos/finanzas/payments");
  await page.getByRole("button", { name: /DEP-193028/ }).click();
  await page.getByRole("button", { name: "Editar registro" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Estado", { exact: true })
    .selectOption("Confirmado");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await page.goto("/#/ordenes/OS-2026-0047");
  await expect(
    page.getByText("Registra la factura antes del despacho.", { exact: true }),
  ).toBeVisible();
});
test("búsqueda global lleva al expediente", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Buscar en el ERP/ }).click();
  await page.getByLabel("Búsqueda global").fill("OS-2026-0041");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Órdenes de servicio y trabajo/ })
    .click();
  await expect(page).toHaveURL(/ordenes\/OS-2026-0041/);
});
test("exportación CSV descarga archivo", async ({ page }) => {
  await page.goto("/#/modulos/comercial/clients");
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const file = await promise;
  expect(file.suggestedFilename()).toBe("clients.csv");
});
test("navegación móvil y formulario sin desbordamiento", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Una visión clara de tu operación." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.getByRole("link", { name: "Comercial M1" }).click();
  await expect(
    page.getByRole("heading", { name: "Gestión Comercial", exact: true }),
  ).toBeVisible();
  await page.goto("/#/modulos/comercial/clients?new=1");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
