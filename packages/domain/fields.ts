import type { Field } from "./types";
export const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, type, required: true, ...extra });
export const client = f("clientId", "Cliente", "select", { ref: "clients" }),
  order = f("orderId", "Orden vinculada", "select", { ref: "orders" });
export const amount = f("amount", "Importe (S/)", "number");
export const date = f("date", "Fecha", "date");
export const detail = f("notes", "Observaciones", "textarea", {
  required: false,
});
export const magnitude = f("magnitude", "Magnitud", "select", {
  options: ["Eléctrica", "Temperatura", "Presión", "Fotometría"],
});
