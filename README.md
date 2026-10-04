# PROMECAL ERP

Primera versión navegable del ERP de PROMECAL S.A.C. Construida desde cero después del análisis de los tres documentos suministrados. `Proyecto_ERP_PROMECAL.docx` gobierna el alcance; los dos PDF del SAP se usan como antecedentes.

## Iniciar

Requisitos: Node.js 22 y npm. Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abrir **http://127.0.0.1:5173**. El frontend funciona sin instalar PostgreSQL. Las modificaciones se guardan en el navegador y se pueden exportar desde Configuración. Las entidades de ejemplo, nombres, RUC, montos y operaciones son ficticias.

Backend opcional, en otra terminal:

```sh
npm run dev:api
```

REST de demostración en **http://127.0.0.1:3001/api/health**. Funciona en memoria y solo escucha conexiones locales. La interfaz usa el repositorio local; el backend no es su almacenamiento activo. Se incluye un cliente REST por recurso para la siguiente etapa.

## Qué puedes recorrer

- Panel general con métricas calculadas, etapas, entregas y alertas.
- Cinco dashboards de módulo y 26 áreas de registros, con búsqueda, filtros, alta/edición, ficha, referencias y exportación CSV.
- Expediente OS/OT con asignación, programación, avance de etapas, recepción, proformas, pedido, diagnóstico, resultados, revisión, firma simulada, documentos, finanzas, no conformidades e historial.
- Planificador por técnico y magnitud, con navegación semanal.
- Clientes y crédito; proforma de calibración sin diagnóstico; diagnóstico previo para soporte; rama de solo diagnóstico; atención de garantía cubierta con OT/nota de cero vinculadas al servicio original.
- Custodia y despacho vinculados a la orden. Conciliación y comprobante antes de entregar a contado; OC y línea disponible para crédito.
- Entradas y consumos de repuestos, recepción de compras, control de existencias y costo imputado al servicio.
- Patrones con vigencia calculada, bloqueo al vencer, competencias y tratamiento de no conformidades.
- Cuentas por cobrar, pagos, seguimiento de cobranza, costos y registro simulado de facturación.
- Diseño adaptable a escritorio y móvil; búsqueda global, formularios accesibles, confirmación para restablecer y respaldo JSON.

## Recorrido recomendado

1. En **Operaciones → Órdenes**, abrir **OS-2026-0042**. Ya tiene resultados registrados. Marcar revisión y firma de demostración y liberar el documento. Consultar Documentos e Historial.
2. Abrir **OS-2026-0047**. Su entrega está bloqueada por pago sin conciliar. En **Finanzas → Pagos**, editar DEP-193028 y confirmar. Luego registrar factura y datos de recojo para completar el despacho.
3. En **Calidad → Patrones**, consultar el patrón vencido PAT-005. No puede asignarse válidamente para iniciar o liberar una calibración.
4. En **Logística → Movimientos**, consumir una unidad de REP-003 contra OT-2026-0044. Consultar el stock actualizado y el costo generado en Finanzas.
5. En **Comercial → Garantías**, aprobar cobertura con vigencia y monto cero. Abrir su ficha y usar **Crear atención cubierta**. La nueva OT conserva la referencia a la orden original; requiere recepción y asignación.

Las fechas del ejemplo se sitúan en octubre de 2026. El cálculo de vigencia utiliza la fecha actual de Lima; al ejecutar después, es normal que caduquen patrones y autorizaciones.

## Estructura

```text
apps/web/                 React + TypeScript + Vite
  src/components/         Componentes, tablas, formularios y diálogos
  src/pages/              Dashboards, expedientes y vistas de trabajo
  src/data/               Puerto de repositorio y adaptadores
apps/api/                 Un único proceso NestJS
  src/modules/comercial/  M1
  src/modules/operaciones/M2
  src/modules/logistica/  M3
  src/modules/finanzas/   M4
  src/modules/calidad/    M5
packages/domain/          Contratos, reglas, datos demo y pruebas
  modules/                Definiciones separadas por módulo
prisma/schema.prisma     Modelo relacional inicial para PostgreSQL
docs/ANALISIS.md          Extracción, fuentes, contradicciones y supuestos
docs/ARQUITECTURA.md      Límites, contratos REST y evolución
tests/                    Pruebas de navegador
```

## Comprobaciones

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Para validar/generar Prisma, copiar `.env.example` a `.env` y configurar `DATABASE_URL`:

```sh
npm run db:validate
npm run db:generate
```

No se ejecutan migraciones automáticamente. El esquema está preparado y validado; la persistencia PostgreSQL, las migraciones revisadas y los repositorios transaccionales son el siguiente trabajo de backend.

## Alcance real de esta etapa

No se conectan SUNAT, bancos, COMPASS, correo, firma electrónica ni contabilidad. Los documentos descargables son fichas de demostración, no certificados oficiales. El cálculo mostrado es únicamente lectura menos referencia; no calcula incertidumbre ni conformidad metrológica.

La sesión única es de demostración. No incluye autenticación real, permisos de servidor, adjuntos binarios, auditoría inmutable, concurrencia multiusuario ni operación de producción. El almacén local puede modificarse desde las herramientas del navegador: los controles de la UI no sustituyen validaciones de servidor.

La propuesta de garantía y los detalles inferidos de logística/finanzas/calidad se identifican en `docs/ANALISIS.md`. No se copió la arquitectura del SAP ni se introdujeron microservicios, colas o Kubernetes.
