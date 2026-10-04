export type ModuleId =
  "comercial" | "operaciones" | "logistica" | "finanzas" | "calidad";
export type Value = string | number | boolean;
export interface Entity {
  id: string;
  [key: string]: Value;
}
export interface Event {
  id: string;
  entityId: string;
  text: string;
  at: string;
  actor: string;
}
export interface Database {
  version: number;
  records: Record<string, Entity[]>;
  events: Event[];
}
export interface Field {
  key: string;
  label: string;
  type?:
    "text" | "email" | "number" | "date" | "textarea" | "select" | "checkbox";
  options?: string[];
  ref?: string;
  required?: boolean;
}
export interface Resource {
  key: string;
  title: string;
  singular: string;
  module: ModuleId;
  description: string;
  prefix: string;
  fields: Field[];
  columns: string[];
  states?: string[];
  readonly?: boolean;
  immutable?: boolean;
}
export interface Module {
  id: ModuleId;
  code: string;
  name: string;
  short: string;
  description: string;
  icon: string;
  color: string;
}
export interface Repository {
  load(): Promise<Database>;
  save(db: Database): Promise<void>;
}
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const money = (value: Value | undefined) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
