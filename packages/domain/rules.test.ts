import { test } from "node:test";
import assert from "node:assert/strict";
import type { Entity } from "./types";
import { createSeed } from "./seed";
import {
  advanceOrder,
  createWarrantyOrder,
  financialReason,
  patternStatus,
  saveEntity,
  technicalReason,
  transitionReason,
  validateEntity,
} from "./rules";
const date = "2026-10-04";
test("calibración se cotiza sin diagnóstico ni orden previa", () => {
  const db = createSeed();
  const q = { ...db.records.quotes[0], id: "PRO-NEW", orderId: "" };
  assert.equal(validateEntity(db, "quotes", q), "");
});
test("soporte requiere diagnóstico antes de proforma", () => {
  const db = createSeed();
  assert.match(
    validateEntity(db, "quotes", {
      ...db.records.quotes[0],
      service: "Soporte técnico",
      orderId: "",
    }),
    /diagnóstico/,
  );
});
test("contado con compromiso inicia pero no despacha", () => {
  const db = createSeed(),
    o = db.records.orders[3];
  assert.equal(financialReason(db, o), "");
  assert.match(financialReason(db, o, true), /pago/);
});
test("voucher por conciliar no desbloquea despacho", () => {
  const db = createSeed();
  assert.match(financialReason(db, db.records.orders[6], true), /pago/);
  db.records.payments[1].status = "Confirmado";
  assert.equal(financialReason(db, db.records.orders[6], true), "");
});
test("crédito exige OC y saldo dentro de línea", () => {
  const db = createSeed(),
    o = db.records.orders[0];
  assert.equal(financialReason(db, o), "");
  db.records.clients[0].creditLimit = 1;
  assert.match(financialReason(db, o), /línea/);
  db.records.clients[0].creditLimit = 30000;
  db.records.customerOrders = [];
  assert.match(financialReason(db, o), /orden de compra/);
});
test("patrón vencido se bloquea y vigencia se deriva de fecha", () => {
  const db = createSeed(),
    o = { ...db.records.orders[1], standardId: "PAT-005" };
  assert.equal(patternStatus(db.records.standards[4], date), "Vencido");
  assert.match(technicalReason(db, o, date), /vencido/);
});
test("se bloquea competencia de otra magnitud y autorización vencida", () => {
  const db = createSeed(),
    o = { ...db.records.orders[0], technicianId: "TEC-002" };
  assert.match(technicalReason(db, o, date), /autorizado/);
  o.technicianId = "TEC-001";
  db.records.technicians[0].due = "2025-01-01";
  assert.match(technicalReason(db, o, date), /vigente/);
});
test("liberación exige revisión y firma, luego genera documento", () => {
  let db = createSeed();
  const o = db.records.orders[1];
  assert.match(transitionReason(db, o, date), /revisión/);
  o.reviewed = true;
  o.signed = true;
  db = advanceOrder(db, o.id, date);
  assert.equal(db.records.orders[1].status, "Liberada");
  assert.ok(db.records.certificates.some((c) => c.orderId === o.id));
  assert.equal(db.records.equipment[1].location, "Despacho · D1");
});
test("no conformidad abierta impide liberación", () => {
  const db = createSeed(),
    o = db.records.orders[1];
  o.reviewed = true;
  o.signed = true;
  db.records.nonconformities[0].orderId = o.id;
  assert.match(transitionReason(db, o, date), /no conformidades/);
});
test("despacho exige factura y destinatario, actualiza custodia", () => {
  let db = createSeed();
  const o = db.records.orders[4];
  assert.match(transitionReason(db, o, date), /recojo/);
  o.recipient = "Cliente de prueba";
  o.deliveryReference = "ACTA-001";
  db = advanceOrder(db, o.id, date);
  assert.equal(db.records.equipment[4].status, "Entregado");
  assert.equal(db.records.dispatches[0].orderId, o.id);
});
test("RUC/DNI y unicidad se validan", () => {
  const db = createSeed(),
    c: Entity = { ...db.records.clients[0], id: "CLI-X" };
  assert.match(validateEntity(db, "clients", c), /existe/);
  c.document = "123";
  assert.match(validateEntity(db, "clients", c), /dígitos/);
});
test("equipo debe pertenecer al cliente de la orden", () => {
  const db = createSeed();
  assert.match(
    validateEntity(db, "orders", {
      ...db.records.orders[0],
      equipmentId: "EQ-002",
    }),
    /pertenecer/,
  );
});
test("error de medición admite negativos y se calcula al guardar", () => {
  const db = createSeed();
  const result = { ...db.records.results[1], reference: -10, reading: -10.02 };
  const next = saveEntity(db, "results", result);
  assert.equal(next.records.results[1].error, -0.02);
  assert.equal(db.records.results[1].error, 0.001);
});
test("garantía cubierta crea OT y nota de cero sin duplicar", () => {
  const db = createSeed();
  db.records.warranties[0].status = "Cubierta";
  db.records.warranties[0].due = "2099-01-01";
  const next = createWarrantyOrder(db, "GAR-001");
  const o = next.records.orders[0];
  assert.equal(o.amount, 0);
  assert.equal(o.originalOrderId, "OT-2026-0044");
  assert.equal(financialReason(next, o), "");
  assert.throws(() => createWarrantyOrder(next, "GAR-001"), /ya tiene/);
});
test("pago confirmado no acepta sobrepago ni edición sin reversión", () => {
  const db = createSeed();
  assert.match(
    validateEntity(db, "payments", {
      ...db.records.payments[1],
      amount: 9000,
      status: "Confirmado",
    }),
    /supera/,
  );
  assert.match(
    validateEntity(db, "payments", { ...db.records.payments[0], amount: 1 }),
    /reversión/,
  );
});
test("consumo descuenta existencias, imputa costo y no permite stock negativo", () => {
  const db = createSeed();
  const movement = {
    id: "MOV-TEST",
    name: "Consumo para reparación",
    stockId: "REP-003",
    kind: "Consumo",
    quantity: 1,
    orderId: "OT-2026-0044",
    date,
  };
  const next = saveEntity(db, "movements", movement);
  assert.equal(next.records.stock[2].quantity, 0);
  assert.equal(next.records.costs[0].amount, 780);
  assert.throws(
    () => saveEntity(next, "movements", { ...movement, id: "MOV-TEST-2" }),
    /stock suficiente/,
  );
  assert.throws(
    () => saveEntity(next, "movements", movement),
    /no puede editarse/,
  );
});
test("recepción de compra aumenta existencias una sola vez", () => {
  const db = createSeed();
  const received = { ...db.records.purchases[0], status: "Recibida" };
  const next = saveEntity(db, "purchases", received);
  assert.equal(next.records.stock[2].quantity, 3);
  assert.throws(() => saveEntity(next, "purchases", received), /ya se recibió/);
});
