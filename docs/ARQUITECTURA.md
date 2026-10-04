# Arquitectura del ERP PROMECAL

## Dirección técnica

React/TypeScript → API REST de un monolito NestJS → PostgreSQL única mediante Prisma. Los cinco módulos son límites de código y de responsabilidad, no servicios desplegados por separado. No se usa RabbitMQ, Kubernetes ni bases por servicio.

En esta etapa, el frontend utiliza `Repository` con un adaptador `LocalRepository`. Las operaciones de dominio construyen un nuevo estado, aplican validaciones y guardan un único snapshot local; el estado visible se actualiza después de guardar. Se muestran errores de cuota/almacenamiento sin simular éxito. `HttpResourceClient` expone operaciones REST por recurso para continuar la integración. No escribe snapshots arbitrarios en el servidor.

El backend utiliza `DemoStore` en memoria, compartido dentro del único proceso, y cinco módulos NestJS. Aplica validaciones de dominio a las operaciones CRUD. Sus registros son independientes del navegador. El API todavía no cubre todas las acciones compuestas de la interfaz; no activar el cliente REST como persistencia completa hasta implementar los comandos faltantes y el repositorio Prisma.

## Propiedad funcional

| Módulo      | Recursos propios                                                        | Colaboraciones                                                                                 |
| ----------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Comercial   | clients, requests, quotes, customerOrders, notes, warranties            | Operaciones consulta cliente y contratación; Finanzas confirma pago; garantía origina nueva OT |
| Operaciones | orders, diagnoses, results, certificates                                | Consume patrones/competencias; referencia equipos; publica finalización y entregables          |
| Logística   | equipment, receipts, dispatches, stock, movements, suppliers, purchases | Custodia de equipos de M2; consumo registra costo en M4; despacho consulta Finanzas            |
| Finanzas    | invoices, payments, collections, costs                                  | Pagos y línea de cliente determinan capacidad de atención/entrega                              |
| Calidad     | standards, nonconformities, documents, technicians                      | Vigencia y competencia habilitan M2; NC impide liberación                                      |

La lógica de dominio está separada de componentes React y controladores NestJS. Los catálogos de cada módulo viven en `packages/domain/modules`. Las pantallas reutilizan componentes genéricos; el expediente y el programa de calibración tienen vistas específicas.

## REST disponible en memoria

Prefijo `/api`, puerto 3001, escucha en 127.0.0.1.

- `GET /health`: estado y modo; declara `databaseConnected: false`.
- `GET /demo/snapshot`: lectura del conjunto demo.
- `GET /{modulo}/{recurso}`: lista de registros propios del módulo.
- `POST /{modulo}/{recurso}`: alta con validación de campos y referencias.
- `PATCH /{modulo}/{recurso}/{id}`: actualización; no puede cambiar el identificador ni forzar el estado de una orden.
- `POST /operaciones/orders/{id}/advance`: avance conforme a reglas del expediente.

Módulos válidos: comercial, operaciones, logistica, finanzas, calidad. Los errores de validación devuelven 400; recursos o identificadores inexistentes, 404. Los registros derivados (certificados y despachos) no admiten altas genéricas. No hay eliminación física de entidades referenciadas.

## Modelo de persistencia previsto

El esquema Prisma incluye clientes, solicitudes, equipo, orden, proforma, OC de cliente, nota de pedido, garantía, recepción, movimientos de custodia, diagnóstico, resultados, documentos de servicio, técnico y autorizaciones por magnitud, patrón, NC, documentos SIG, inventario/movimientos, proveedores/compras/líneas, factura/pago/cobranza/costo/despacho y eventos de auditoría.

Importes usan Decimal; relaciones usan claves foráneas; documentos de cliente, series y códigos tienen restricciones de unicidad. Una proforma puede existir sin orden para respetar la secuencia de calibración. La OC del cliente y la compra al proveedor son modelos diferentes. Cada autorización por técnico/magnitud tiene su propia vigencia.

El esquema expresa el destino normalizado; los registros flexibles del adaptador demo necesitan mapeadores a entidades Prisma. Antes de migrar: validar catálogos y restricciones con la empresa, implementar reglas de transacción, agregar pruebas con PostgreSQL y definir concurrencia optimista/idempotencia para cobros, consumos y transiciones.

## Límites que deben continuar

1. Autenticación, sesiones y RBAC de servidor por responsabilidades documentadas; separación de captura y aprobación.
2. Repositorios Prisma por módulo con servicios de aplicación para acciones compuestas; acceso entre módulos por contratos internos, no escritura directa de tablas ajenas.
3. Comandos transaccionales para recepción, garantía, notas, conciliación, stock, firma/liberación y despacho. Las verificaciones de crédito/vigencia deben repetirse dentro de la transacción.
4. Evidencias/adjuntos con almacenamiento seguro, versionado, límites, antivirus y permisos de lectura.
5. Firma real y motor de cálculo metrológico validado por magnitud; revisiones e historial de documentos emitidos.
6. Adaptadores SUNAT, COMPASS, bancos, correo y contabilidad, con credenciales de entorno e idempotencia. No exponerlos como disponibles antes de integrarlos y verificarlos.

No se afirma equivalencia de los controles locales con seguridad o contabilidad de producción.
