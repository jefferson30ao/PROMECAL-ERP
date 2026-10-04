# Verificación de la primera versión

Realizada el 4 de octubre de 2026.

- Compilación de React/TypeScript y NestJS/TypeScript: correcta.
- 17 pruebas de dominio: correctas. Cubren cotización diferenciada, contado/compromiso, conciliación, línea de crédito y OC, patrón vencido, competencias, revisión/firma, no conformidades, despacho, identidad de cliente/equipo, lecturas negativas, garantía, sobrepagos, consumo e ingreso de compras.
- 10 pruebas Playwright: correctas. Incluyen navegación de las 26 áreas, alta/edición y persistencia de cliente, filtros/vacíos, liberación e historial, conciliación, búsqueda global, exportación, móvil, consumo/costo y creación de atención de garantía.
- Revisión visual: dashboard, lista de órdenes, expediente, planificador y vista móvil de 390 px. Tablas con desplazamiento interno; sin desbordamiento horizontal de la página móvil.
- Prisma: esquema validado y cliente generado. No se ha conectado una instancia PostgreSQL ni ejecutado migraciones.
- REST de demostración: salud, lectura en los cinco módulos, rechazo de entrada incompleta y rechazo de recurso fuera del módulo comprobados.
- Auditoría npm al cierre: cero vulnerabilidades reportadas en las dependencias instaladas.

La aprobación de estas pruebas se limita a la versión local de demostración. Las integraciones externas, firma válida, cálculos metrológicos definitivos, autenticación y persistencia real no forman parte de lo verificado.

Las capturas y utilidades temporales se guardaron en `tmp/`, excluido del control de versiones. Los datos modificados por pruebas de navegador viven en contextos aislados y no reemplazan los documentos fuente.
