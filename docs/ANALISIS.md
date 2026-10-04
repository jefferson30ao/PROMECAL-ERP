# Análisis previo del ERP PROMECAL

## Autoridad y alcance

Fuente de verdad: `Proyecto_ERP_PROMECAL.docx`, secciones 4.4–4.7, 5.2, 5.4 y 6.1–6.1.1. Antecedentes consultados: documento de análisis SAP (91 páginas, CUS-01 a CUS-15 y modelo de dominio pp. 51–54) y documento de arquitectura SAP (92 páginas, casos de uso pp. 16–33, restricciones pp. 43–45, arquitectura pp. 46–48 y datos pp. 91–92). Las extracciones quedan en `docs/sources`.

El documento principal es una propuesta y diagnóstico, no una especificación funcional completa. Se conservan expresamente sus incertidumbres. La primera etapa implementa navegación, registros editables, flujos simulados y controles de negocio demostrables. Los datos son ficticios. No constituye un sistema tributario, metrológico ni de autenticación listo para producción.

## Delimitación y actores

| Módulo                                | Responsable                                                                                                         | Entidades y pantallas                                                                                                        | Relaciones                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| M1 Gestión Comercial                  | Ejecutivo de Ventas                                                                                                 | Clientes RUC/DNI, solicitudes multicanal, proformas y condiciones, OC cliente, notas de pedido, líneas de crédito, garantías | Cliente único con M2–M4; proforma aceptada origina pedido; garantías referencian orden original |
| M2 Operaciones de Servicio            | Jefe de Laboratorio*, técnico de calibración, jefe de Servicio Técnico*, asistente técnico, especialista de soporte | OS, OT, programa por técnico y magnitud, diagnóstico, notas y resultados, certificados e informes                            | Equipos recibidos por M3, pedido M1, patrones y competencias M5, costos M4                      |
| M3 Logística, Inventario y Compras    | Recepción y Despacho; Logística y Compras*                                                                          | Recepciones guía/F01, equipos en custodia, ubicaciones, actas, despacho, repuestos, movimientos, proveedores, OC proveedor   | Recepción/entrega de órdenes M2; consumo/costo M4; bloqueo financiero M4                        |
| M4 Finanzas y Facturación             | Asistente Administrativo                                                                                            | Facturas, CxC, pagos, conciliación, cobranza, costos por orden, integración contable                                         | Verifica pagos y crédito de M1; habilita despacho M3; costos M2/M3                              |
| M5 Calidad, Metrología y Competencias | Responsable de Calidad*, jefes y técnicos                                                                           | Patrones, recalibraciones, no conformidades y acciones correctivas, documentos SIG, competencias por magnitud, liberación    | Controla asignación y emisión M2; documento y trazabilidad únicos                               |

Los cargos con asterisco son inferidos por el propio documento (4.7), pendientes de validación. Gerencia y administrador se usan como perfiles de demostración, sin equivaler a permisos de servidor.

## Procesos que rigen la implementación

1. **Calibración (5.4.1)**: solicitud → cliente y alcance → proforma/condiciones → aceptación escrita (OC obligatoria si crédito) → recepción con guía/F01 → verificación del equipo → nota de pedido con verificación financiera → OS → programa y técnico → resultados → revisión/recalculo → autorización o salida no conforme → certificado/informe de verificación → acta F06 → facturación y despacho.
2. **Soporte (5.4.2)**: solicitud → aceptación del costo de diagnóstico → recepción → OT → diagnóstico → proforma → aceptación → nota de pedido/validación financiera → mantenimiento/reparación → informe y acta → pago para envío de informe a contado → despacho. Si irreparable o rechazado: proforma y nota únicamente por diagnóstico; sigue existiendo una obligación de cobro.
3. **Garantía (5.4.3, propuesta a validar)**: referencia a orden original → recepción → diagnóstico de cobertura → si cubierto, pedido Garantía por cero; si no cubierto, soporte normal desde proforma. No se inventa una duración contractual fija de garantía.
4. **Compras (6.1 P7, inferido)**: necesidad/stock mínimo → OC proveedor vinculada a orden → recepción de repuestos → consumo → imputación de costo. La etapa inicial permite administrar registros; no representa un libro de inventario transaccional definitivo.
5. **Calidad (6.1 P5/P8)**: patrones vigentes y técnico autorizado → captura → revisión → aprobación → firma → liberación. Las fórmulas de incertidumbre y firma electrónica real quedan pendientes; la demostración calcula solamente error = lectura − referencia.

## Reglas y evidencia

| ID  | Regla                                                                             | Fuente                               | Aplicación inicial                                             |
| --- | --------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------- |
| R01 | Calibración no requiere diagnóstico previo                                        | 5.4.1 y 5.5                          | Flujo separado de soporte                                      |
| R02 | Crédito: OC y línea disponible; contado: evidencia o compromiso antes de atención | 4.5, 5.4.1 pasos 5/8, 6.1 P3         | Validación al formalizar/iniciar servicio                      |
| R03 | Recepción con guía o F01                                                          | 5.2, 5.4.1 paso 6                    | Referencia de recepción y custodia                             |
| R04 | Revisión de resultados antes de emitir; no conformidad si no conformes            | 5.4.1 pasos 11–13, 6.1 P5            | Resultado, revisión, firma simulada y liberación diferenciados |
| R05 | Bloquear patrones vencidos y técnicos sin autorización por magnitud               | 6.1 P8                               | Validación en inicio y liberación                              |
| R06 | Contado requiere pago confirmado antes de factura/entrega e informe de soporte    | 5.4.1 paso 16, 5.4.2 paso 12, 6.1 P3 | Conciliación y bloqueo de entrega                              |
| R07 | Soporte rechazado/irreparable cobra diagnóstico                                   | 5.4.2 paso 8                         | Rama de solo diagnóstico                                       |
| R08 | Garantía cubierta: monto cero y vínculo a orden original                          | 5.4.3 (propuesto)                    | Registro y validación de garantía                              |
| R09 | Maestro único de clientes/equipos/órdenes                                         | Introducción, 6.1 P1                 | Referencias por identificador, repositorio compartido          |

## Estados diseñados para esta etapa

El documento no da un catálogo exhaustivo. Estos nombres son decisiones de interfaz:

- Proforma: Borrador, Enviada, Aceptada, Rechazada.
- Orden: Pendiente, Programada, En proceso, En revisión, Liberada, Despachada. El diagnóstico previo se identifica dentro de la OT y no se impone a calibración.
- Diagnóstico: Pendiente, Reparable, Irreparable; decisión comercial: Pendiente, Aceptado, Rechazado.
- Pago: Por conciliar, Confirmado, Observado. Una referencia/voucher sin conciliar no equivale a pago confirmado.
- Factura: Borrador, Pendiente, Pagada. Todo comprobante de esta versión es simulado, sin envío SUNAT.
- Patrón: Vigente, Por vencer, Vencido (derivado de fecha).
- No conformidad: Abierta, En tratamiento, Cerrada; requiere acción correctiva para cerrar.
- OC proveedor: Borrador, Emitida, Recibida. Documento SIG: Borrador, Vigente, Obsoleto.

## Documentos

Se preservan los códigos F01-VEN-PR-01 (alcance), RYD-PR-01 (recepción/despacho), F01-RYD-PR-01 (sin guía), CAL-PR-06 (certificados/informes), F06-CAL-PR-04 (acta), STO-PR-01 (soporte), F01-SIG-PR-05 (salida no conforme). Proformas, OC de cliente y proveedor son entidades distintas. Se diferencian certificado de calibración, informe de verificación, informe de diagnóstico e informe de reparación; no se introduce el “certificado de soporte” del SAP como obligación del ERP.

## Contradicciones resueltas

- SAP análisis CUS-12 y arquitectura CUS-06 requieren OT previa a toda proforma. Se aplica únicamente a soporte; calibración sigue 5.4.1.
- SAP CUS-13 sitúa nota de pedido después de completar servicio. ERP la exige antes de ejecución (5.4.1 paso 8 / 5.4.2 paso 9).
- SAP centra pagos/autorización en Ventas. ERP distribuye validación y facturación en Administración/Finanzas y despacho en M3.
- SAP condiciona entrega a pago en todo caso. ERP distingue crédito y contado; se adopta como supuesto de interfaz permitir entrega a crédito autorizado con OC.
- El PDF de arquitectura efectivamente proporcionado describe tres capas, Java/SQL Server y base centralizada (pp. 43, 46 y 92), aunque el documento principal también menciona otro antecedente distribuido. Ninguna de esas decisiones se hereda: se implementa React → un NestJS modular → una PostgreSQL con Prisma.

## Supuestos y pendientes de validación

- S01: Catálogos de estados, numeración interna, colores de prioridad y plazos de alerta (30 días) son propuestas.
- S02: Datos, usuarios, montos, fechas y carga de trabajo de muestra son ficticios. No se completan RUC ni domicilio fiscal de PROMECAL.
- S03: Compromiso permite inicio a contado pero no despacho. Crédito vigente y OC permiten despacho sin pago previo, pendiente de validar política precisa de mora/excepciones.
- S04: Fechas de garantía se ingresan según contrato; cobertura la decide el diagnóstico, no la fecha por sí sola.
- S05: Detalle de inventario, compras, costeo, cobranza y control documental es propuesto porque el documento los identifica como inferidos o de baja base documental.
- S06: No hay fórmulas metrológicas, incertidumbres, tolerancias por magnitud, contenido íntegro de procedimientos ni proveedor de firma. No se declara un resultado metrológico válido a partir de cálculos de demostración.
- S07: SUNAT, bancos, correo, firma y contabilidad se presentan como integraciones pendientes; no se realizan envíos reales.
- S08: Sesión única de demostración, persistencia local del navegador y bitácora local. Autenticación, RBAC del servidor, concurrencia, almacenamiento de adjuntos y auditoría inmutable corresponden a siguiente etapa.

## Arquitectura acordada

Monorepo npm: `apps/web` (React/TS), `apps/api` (NestJS/TS, cinco módulos), `packages/domain` (contratos y reglas puras), `prisma/schema.prisma` (modelo relacional inicial único). La UI usa un puerto de repositorio asíncrono con adaptador local; existe adaptador HTTP para REST. NestJS expone un adaptador de demostración en memoria. PostgreSQL/Prisma quedan preparados mediante esquema y configuración; no se afirma persistencia real hasta implementar repositorios y migraciones verificadas.

El análisis precede a la implementación. Las comprobaciones deben cubrir especialmente flujo de calibración sin diagnóstico, crédito/contado, diagnóstico rechazado, patrón vencido, competencia, liberación y despacho.
