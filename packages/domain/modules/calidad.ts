import type { Resource } from "../types";
import { f, client, order, amount, date, detail, magnitude } from "../fields";
export const calidadResources: Resource[] = [
  {
    key: "standards",
    module: "calidad",
    title: "Patrones de referencia",
    singular: "patrón",
    prefix: "PAT",
    description:
      "Vigencia y trazabilidad metrológica. Uso bloqueado al vencer.",
    columns: ["name", "serial", "magnitude", "due", "status"],
    fields: [
      f("name", "Patrón"),
      f("serial", "Número de serie"),
      magnitude,
      f("certificate", "Certificado de referencia"),
      f("due", "Próxima recalibración", "date"),
      detail,
    ],
  },
  {
    key: "nonconformities",
    module: "calidad",
    title: "No conformidades",
    singular: "no conformidad",
    prefix: "NC",
    description:
      "Registro F01-SIG-PR-05 y seguimiento de acciones correctivas.",
    columns: ["name", "orderId", "owner", "due", "status"],
    states: ["Abierta", "En tratamiento", "Cerrada"],
    fields: [
      f("name", "Descripción del hallazgo"),
      order,
      f("owner", "Responsable"),
      f("cause", "Análisis de causa", "textarea"),
      f("action", "Acción correctiva", "textarea", { required: false }),
      f("due", "Fecha objetivo", "date"),
      detail,
    ],
  },
  {
    key: "documents",
    module: "calidad",
    title: "Control documentario",
    singular: "documento SIG",
    prefix: "SIG",
    description:
      "Procedimientos y formatos de referencia del sistema de gestión.",
    columns: ["name", "code", "revision", "owner", "status"],
    states: ["Borrador", "Vigente", "Obsoleto"],
    fields: [
      f("name", "Título"),
      f("code", "Código del documento"),
      f("revision", "Revisión"),
      f("owner", "Área responsable"),
      f("date", "Fecha de revisión", "date"),
      detail,
    ],
  },
  {
    key: "technicians",
    module: "calidad",
    title: "Competencias y autorizaciones",
    singular: "autorización técnica",
    prefix: "TEC",
    description: "Matriz de personal autorizado por magnitud y vigencia.",
    columns: ["name", "magnitude", "role", "due", "status"],
    states: ["Autorizado", "En formación", "Suspendido"],
    fields: [
      f("name", "Nombre del técnico"),
      magnitude,
      f("role", "Función", "select", {
        options: [
          "Técnico de calibración",
          "Especialista de soporte técnico",
          "Jefe de laboratorio",
        ],
      }),
      f("due", "Vigencia de autorización", "date"),
      f("evidence", "Evidencia de competencia"),
      detail,
    ],
  },
];
