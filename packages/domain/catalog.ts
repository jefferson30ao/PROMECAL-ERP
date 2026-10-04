import { comercialResources } from "./modules/comercial";
import { operacionesResources } from "./modules/operaciones";
import { logisticaResources } from "./modules/logistica";
import { finanzasResources } from "./modules/finanzas";
import { calidadResources } from "./modules/calidad";
import type { Field, Module, Resource } from "./types";
export const modules: Module[] = [
  {
    id: "comercial",
    code: "M1",
    name: "Gestión Comercial",
    short: "Comercial",
    description: "Relaciones que se convierten en servicios.",
    icon: "Handshake",
    color: "#447cbe",
  },
  {
    id: "operaciones",
    code: "M2",
    name: "Operaciones de Servicio",
    short: "Operaciones",
    description: "Cada servicio, del ingreso a la entrega.",
    icon: "FlaskConical",
    color: "#168477",
  },
  {
    id: "logistica",
    code: "M3",
    name: "Logística, Inventario y Compras",
    short: "Logística",
    description: "Equipos, materiales y abastecimiento bajo control.",
    icon: "Package",
    color: "#bd8743",
  },
  {
    id: "finanzas",
    code: "M4",
    name: "Finanzas y Facturación",
    short: "Finanzas",
    description: "Visibilidad financiera para cada orden.",
    icon: "Wallet",
    color: "#8272b6",
  },
  {
    id: "calidad",
    code: "M5",
    name: "Calidad, Metrología y Competencias",
    short: "Calidad",
    description: "Confianza y trazabilidad en cada medición.",
    icon: "ShieldCheck",
    color: "#5e8993",
  },
];
export const resources: Resource[] = [
  ...comercialResources,
  ...operacionesResources,
  ...logisticaResources,
  ...finanzasResources,
  ...calidadResources,
];
export const resourceByKey = (key: string) =>
  resources.find((r) => r.key === key);
