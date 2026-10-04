import { resourceByKey } from "./catalog";
import type { Database, Entity } from "./types";
import { today } from "./types";
export const related = (db: Database, key: string, id: string) =>
  db.records[key]?.filter((r) => r.orderId === id) || [];
export const paid = (db: Database, id: string) =>
  related(db, "payments", id)
    .filter((p) => p.status === "Confirmado")
    .reduce((s, p) => s + Number(p.amount), 0);
export function patternStatus(p: Entity, date = today()) {
  return String(p.due) < date
    ? "Vencido"
    : String(p.due) <=
        new Date(new Date(date + "T12:00:00Z").getTime() + 30 * 86400000)
          .toISOString()
          .slice(0, 10)
      ? "Por vencer"
      : "Vigente";
}
export function financialReason(
  db: Database,
  o: Entity,
  dispatch = false,
): string {
  const c = db.records.clients.find((c) => c.id === o.clientId);
  if (!c) return "Selecciona un cliente válido.";
  const n = related(db, "notes", o.id).find((n) => n.status === "Validada");
  if (!n) return "Se requiere una nota de pedido validada en Comercial.";
  if (
    n.type === "Garantía" &&
    Number(n.amount) === 0 &&
    Number(o.amount) === 0 &&
    db.records.warranties.some(
      (w) => w.id === n.warrantyId && w.status === "Cubierta",
    )
  )
    return "";
  if (c.payment === "Crédito") {
    if (
      !db.records.customerOrders.some(
        (x) => x.id === n.customerOrderId && x.clientId === c.id,
      )
    )
      return "El cliente con crédito requiere su orden de compra.";
    const exposure = db.records.orders
      .filter(
        (x) =>
          x.clientId === c.id &&
          related(db, "notes", x.id).some((n) => n.status === "Validada"),
      )
      .reduce((s, x) => s + Math.max(0, Number(x.amount) - paid(db, x.id)), 0);
    if (exposure > Number(c.creditLimit))
      return "El saldo de servicios supera la línea de crédito disponible.";
  } else if (paid(db, o.id) < Number(o.amount) && !(n.commitment && !dispatch))
    return dispatch
      ? "Despacho bloqueado: el pago de contado debe estar conciliado en su totalidad."
      : "Se requiere pago confirmado o compromiso de pago antes de iniciar.";
  return "";
}
export function technicalReason(
  db: Database,
  o: Entity,
  date = today(),
): string {
  const t = db.records.technicians.find((t) => t.id === o.technicianId);
  if (
    !t ||
    t.status !== "Autorizado" ||
    t.magnitude !== o.magnitude ||
    String(t.due) < date
  )
    return "Selecciona un técnico autorizado y vigente para esta magnitud.";
  if (
    o.service === "Calibración" &&
    t.role === "Especialista de soporte técnico"
  )
    return "La calibración requiere un técnico de calibración autorizado.";
  if (
    o.service === "Soporte técnico" &&
    t.role !== "Especialista de soporte técnico"
  )
    return "El soporte requiere un especialista de soporte técnico autorizado.";
  if (o.service === "Calibración") {
    const p = db.records.standards.find((p) => p.id === o.standardId);
    if (
      !p ||
      p.magnitude !== o.magnitude ||
      patternStatus(p, date) === "Vencido"
    )
      return "Selecciona un patrón vigente para esta magnitud. Un patrón vencido no puede utilizarse.";
  }
  return "";
}
export function validateEntity(db: Database, key: string, e: Entity): string {
  const resource = resourceByKey(key);
  if (!resource) return "Recurso no encontrado.";
  for (const f of resource.fields) {
    const v = e[f.key];
    if (f.required && (v === undefined || v === ""))
      return `Completa el campo ${f.label}.`;
    if (
      f.type === "number" &&
      v !== undefined &&
      v !== "" &&
      (!Number.isFinite(Number(v)) ||
        (!["reference", "reading"].includes(f.key) && Number(v) < 0))
    )
      return `${f.label} debe ser un número válido${["reference", "reading"].includes(f.key) ? "" : " mayor o igual a cero"}.`;
    if (f.ref && v && !db.records[f.ref]?.some((r) => r.id === v))
      return `${f.label}: selecciona un registro existente.`;
    if (f.options && v && !f.options.includes(String(v)))
      return `${f.label}: opción no válida.`;
    if (
      f.type === "date" &&
      v &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ||
        Number.isNaN(Date.parse(String(v))))
    )
      return `${f.label}: fecha no válida.`;
  }
  if (
    resource.states &&
    e.status &&
    !resource.states.includes(String(e.status))
  )
    return "Estado no válido.";
  const existing = db.records[key].find((x) => x.id === e.id);
  if (resource.immutable && existing)
    return "Este movimiento ya está aplicado y no puede editarse.";
  if (key === "purchases" && existing?.status === "Recibida")
    return "La compra ya se recibió; registra un nuevo movimiento para cualquier ajuste.";
  if (key === "movements") {
    if (!Number.isInteger(Number(e.quantity)) || Number(e.quantity) <= 0)
      return "La cantidad debe ser un entero mayor que cero.";
    if (e.kind === "Consumo" && !e.orderId)
      return "El consumo debe imputarse a una orden.";
    if (
      e.kind === "Consumo" &&
      Number(e.quantity) >
        Number(db.records.stock.find((s) => s.id === e.stockId)?.quantity)
    )
      return "No hay stock suficiente para este consumo.";
  }
  if (
    key === "purchases" &&
    (!Number.isInteger(Number(e.quantity)) || Number(e.quantity) <= 0)
  )
    return "La cantidad de compra debe ser un entero mayor que cero.";
  if (
    ["results", "diagnoses"].includes(key) &&
    ["Liberada", "Despachada"].includes(
      String(db.records.orders.find((o) => o.id === e.orderId)?.status),
    )
  )
    return "La orden ya está liberada; sus registros técnicos están cerrados.";
  if (
    key === "payments" &&
    existing?.status === "Confirmado" &&
    JSON.stringify(existing) !== JSON.stringify(e)
  )
    return "Un pago confirmado requiere un flujo de reversión, pendiente de implementar. No se puede editar.";
  if (key === "clients") {
    if (
      !new RegExp(`^\\d{${e.documentType === "DNI" ? 8 : 11}}$`).test(
        String(e.document),
      )
    )
      return "El DNI requiere 8 dígitos y el RUC 11 dígitos.";
    if (
      db.records.clients.some((c) => c.id !== e.id && c.document === e.document)
    )
      return "Ya existe un cliente con este documento.";
  }
  if (
    key === "equipment" &&
    db.records.equipment.some((c) => c.id !== e.id && c.serial === e.serial)
  )
    return "Ya existe un equipo con esta serie o código.";
  if (
    key === "orders" &&
    db.records.equipment.find((x) => x.id === e.equipmentId)?.clientId !==
      e.clientId
  )
    return "El equipo debe pertenecer al cliente seleccionado.";
  if (
    key === "quotes" &&
    e.service !== "Calibración" &&
    !related(db, "diagnoses", String(e.orderId)).some(
      (d) => d.status !== "Pendiente",
    )
  )
    return "Soporte requiere un diagnóstico completado antes de cotizar.";
  if (key === "quotes" && e.status === "Aceptada" && !e.acceptance)
    return "Registra la referencia de aceptación escrita del cliente.";
  if (key === "notes") {
    const o = db.records.orders.find((o) => o.id === e.orderId),
      q = db.records.quotes.find((q) => q.id === e.quoteId);
    if (!o || !q || o.clientId !== e.clientId || q.clientId !== e.clientId)
      return "Orden, proforma y nota deben corresponder al mismo cliente.";
    if (e.status === "Validada" && q.status !== "Aceptada")
      return "La proforma debe tener aceptación escrita antes de validar el pedido.";
    if (
      e.customerOrderId &&
      db.records.customerOrders.find((c) => c.id === e.customerOrderId)
        ?.quoteId !== e.quoteId
    )
      return "La OC del cliente debe corresponder a la proforma seleccionada.";
    if (Number(e.amount) !== Number(q.amount))
      return "El importe debe coincidir con la proforma.";
    if (e.status === "Validada") {
      const temp = structuredClone(db);
      temp.records.notes = [
        ...temp.records.notes.filter((n) => n.id !== e.id),
        e,
      ];
      const reason = financialReason(temp, { ...o, amount: e.amount });
      if (reason) return reason;
    }
  }
  if (
    key === "customerOrders" &&
    db.records.quotes.find((q) => q.id === e.quoteId)?.clientId !== e.clientId
  )
    return "La proforma y la OC deben pertenecer al mismo cliente.";
  if (
    key === "diagnoses" &&
    db.records.orders.find((o) => o.id === e.orderId)?.service !==
      "Soporte técnico"
  )
    return "El diagnóstico previo corresponde únicamente a soporte técnico.";
  if (
    key === "warranties" &&
    e.status === "Cubierta" &&
    (Number(e.amount) !== 0 || !e.originalOrderId)
  )
    return "Una garantía cubierta debe vincularse a la orden original y tener monto cero.";
  if (
    key === "warranties" &&
    e.status === "Cubierta" &&
    String(e.due) < today()
  )
    return "La garantía está fuera de la vigencia contractual registrada.";
  if (
    key === "warranties" &&
    db.records.orders.find((o) => o.id === e.originalOrderId)?.clientId !==
      e.clientId
  )
    return "La orden original debe corresponder al cliente de la garantía.";
  if (key === "nonconformities" && e.status === "Cerrada" && !e.action)
    return "Registra la acción correctiva antes de cerrar la no conformidad.";
  if (key === "invoices") {
    const o = db.records.orders.find((o) => o.id === e.orderId);
    if (o?.clientId !== e.clientId)
      return "La factura debe corresponder al cliente de la orden.";
    if (
      e.status !== "Borrador" &&
      db.records.clients.find((c) => c.id === e.clientId)?.payment ===
        "Contado" &&
      paid(db, String(e.orderId)) < Number(e.amount)
    )
      return "Confirma el depósito antes de emitir la factura de contado.";
    if (e.status === "Pagada" && paid(db, String(e.orderId)) < Number(e.amount))
      return "El pago confirmado no cubre el importe de la factura.";
  }
  if (key === "payments" && Number(e.amount) <= 0)
    return "El importe del pago debe ser mayor que cero.";
  if (key === "payments" && e.status === "Confirmado") {
    const other = related(db, "payments", String(e.orderId))
      .filter((p) => p.id !== e.id && p.status === "Confirmado")
      .reduce((s, p) => s + Number(p.amount), 0);
    const o = db.records.orders.find((o) => o.id === e.orderId);
    if (other + Number(e.amount) > Number(o?.amount))
      return "El pago supera el saldo de la orden. Revisa el importe.";
  }
  return "";
}
export function createWarrantyOrder(db: Database, id: string): Database {
  const w = db.records.warranties.find((w) => w.id === id);
  if (
    !w ||
    w.status !== "Cubierta" ||
    Number(w.amount) !== 0 ||
    String(w.due) < today()
  )
    throw new Error(
      "Se requiere cobertura aprobada, vigente y por monto cero.",
    );
  if (db.records.notes.some((n) => n.warrantyId === id))
    throw new Error("Esta garantía ya tiene una atención vinculada.");
  const original = db.records.orders.find((o) => o.id === w.originalOrderId);
  if (!original) throw new Error("No existe la orden original.");
  const next = structuredClone(db),
    orderId = `OT-GAR-${Date.now().toString().slice(-7)}`;
  next.records.orders.unshift({
    id: orderId,
    name: `Garantía · ${original.name}`,
    clientId: original.clientId,
    equipmentId: original.equipmentId,
    service: "Soporte técnico",
    magnitude: original.magnitude,
    priority: "Normal",
    date: today(),
    due: today(),
    amount: 0,
    status: "Pendiente",
    originalOrderId: original.id,
    notes: String(w.diagnosis),
  });
  next.records.notes.unshift({
    id: `NP-GAR-${Date.now().toString().slice(-7)}`,
    name: `Atención de garantía · ${w.id}`,
    clientId: original.clientId,
    orderId,
    amount: 0,
    type: "Garantía",
    warrantyId: w.id,
    originalOrderId: original.id,
    status: "Validada",
  });
  next.records.diagnoses.unshift({
    id: `DIA-GAR-${Date.now().toString().slice(-7)}`,
    name: "Diagnóstico de cobertura",
    orderId,
    findings: w.diagnosis,
    recommendation: "Atender cobertura aprobada",
    amount: 0,
    decision: "Aceptado",
    status: "Reparable",
  });
  logEvent(
    next,
    orderId,
    `Atención de garantía cubierta creada desde ${original.id}`,
  );
  return next;
}
export const transitions: Record<string, string> = {
  Pendiente: "Programada",
  Programada: "En proceso",
  "En proceso": "En revisión",
  "En revisión": "Liberada",
  Liberada: "Despachada",
};
export function transitionReason(
  db: Database,
  o: Entity,
  date = today(),
): string {
  if (o.status === "Despachada") return "La orden ya fue despachada.";
  if (!related(db, "receipts", o.id).length)
    return "Registra primero la recepción del equipo con guía o F01.";
  if (o.status === "Pendiente" || o.status === "Programada") {
    const reason = technicalReason(db, o, date);
    if (reason) return reason;
    if (o.status === "Programada") {
      const finance = financialReason(db, o);
      if (finance) return finance;
      if (
        o.service === "Soporte técnico" &&
        !related(db, "diagnoses", o.id).some(
          (d) => d.status === "Reparable" && d.decision === "Aceptado",
        )
      )
        return "Completa el diagnóstico y registra la aceptación de reparación. Si no procede, utiliza Solo diagnóstico.";
    }
  }
  if (
    o.status === "En proceso" &&
    !related(db, "results", o.id).some((r) => r.status === "Registrado")
  )
    return "Registra los resultados o notas técnicas antes de enviar a revisión.";
  if (o.status === "En revisión") {
    const reason = technicalReason(db, o, date);
    if (reason) return reason;
    if (!o.reviewed || !o.signed)
      return "Registra la revisión y la firma de demostración antes de liberar.";
    if (
      related(db, "nonconformities", o.id).some((n) => n.status !== "Cerrada")
    )
      return "Resuelve las no conformidades abiertas antes de liberar.";
  }
  if (o.status === "Liberada") {
    const reason = financialReason(db, o, true);
    if (reason) return reason;
    if (
      Number(o.amount) > 0 &&
      !related(db, "invoices", o.id).some((i) => i.status !== "Borrador")
    )
      return "Registra la factura antes del despacho.";
    if (!o.recipient || !o.deliveryReference)
      return "Registra el responsable del recojo y la referencia de guía o acta.";
  }
  return "";
}
export function logEvent(db: Database, id: string, text: string) {
  db.events.unshift({
    id: crypto.randomUUID(),
    entityId: id,
    text,
    at: new Date().toISOString(),
    actor: "Usuario de demostración",
  });
}
export function saveEntity(
  db: Database,
  key: string,
  entity: Entity,
): Database {
  const error = validateEntity(db, key, entity);
  if (error) throw new Error(error);
  const next = structuredClone(db),
    exists = next.records[key].some((r) => r.id === entity.id);
  if (key === "results")
    entity = {
      ...entity,
      error: Number(
        (Number(entity.reading) - Number(entity.reference)).toFixed(8),
      ),
    };
  next.records[key] = exists
    ? next.records[key].map((r) => (r.id === entity.id ? entity : r))
    : [entity, ...next.records[key]];
  if (key === "movements") {
    const stock = next.records.stock.find((s) => s.id === entity.stockId)!;
    stock.quantity =
      Number(stock.quantity) +
      (entity.kind === "Consumo" ? -1 : 1) * Number(entity.quantity);
    if (entity.kind === "Consumo")
      next.records.costs.unshift({
        id: `COS-${entity.id}`,
        name: `Consumo · ${stock.name}`,
        orderId: entity.orderId,
        category: "Repuesto",
        amount: Number(stock.cost) * Number(entity.quantity),
        date: entity.date,
      });
  }
  if (key === "purchases" && entity.status === "Recibida") {
    const stock = next.records.stock.find((s) => s.id === entity.stockId)!;
    stock.quantity = Number(stock.quantity) + Number(entity.quantity);
    next.records.movements.unshift({
      id: `MOV-${entity.id}`,
      name: `Recepción de compra ${entity.id}`,
      stockId: entity.stockId,
      kind: "Entrada",
      quantity: entity.quantity,
      orderId: entity.orderId || "",
      date: today(),
    });
  }
  if (key === "notes" && entity.status === "Validada")
    next.records.orders = next.records.orders.map((o) =>
      o.id === entity.orderId ? { ...o, amount: entity.amount } : o,
    );
  logEvent(
    next,
    entity.id,
    `${exists ? "Actualización" : "Registro"} de ${resourceByKey(key)?.singular}`,
  );
  return next;
}
export function advanceOrder(
  db: Database,
  id: string,
  date = today(),
): Database {
  const next = structuredClone(db),
    o = next.records.orders.find((o) => o.id === id);
  if (!o) throw new Error("Orden no encontrada.");
  const reason = transitionReason(next, o, date);
  if (reason) throw new Error(reason);
  o.status = transitions[String(o.status)];
  const eq = next.records.equipment.find((e) => e.id === o.equipmentId);
  if (o.status === "En proceso" && eq) {
    eq.status =
      o.service === "Calibración" ? "En laboratorio" : "En servicio técnico";
    eq.location =
      o.service === "Calibración"
        ? `Laboratorio de ${String(o.magnitude).toLowerCase()}`
        : "Servicio técnico";
  }
  if (o.status === "Liberada") {
    const quote = next.records.quotes.find(
      (q) => q.id === related(next, "notes", o.id)[0]?.quoteId,
    );
    next.records.certificates.push({
      id: `DOC-${crypto.randomUUID().slice(0, 8)}`,
      name: String(
        quote?.deliverable ||
          (o.service === "Soporte técnico"
            ? "Informe de reparación"
            : "Certificado de calibración"),
      ),
      orderId: id,
      date,
      reviewer: "Revisión y firma de demostración",
      status: "Liberado",
    });
    if (eq) {
      eq.status = "Listo para entrega";
      eq.location = "Despacho · D1";
    }
  }
  if (o.status === "Despachada") {
    next.records.dispatches.push({
      id: `DES-${crypto.randomUUID().slice(0, 8)}`,
      name: String(o.deliveryReference),
      orderId: id,
      recipient: String(o.recipient),
      date,
      status: "Entregado",
    });
    if (eq) {
      eq.status = "Entregado";
      eq.location = "Cliente";
    }
  }
  logEvent(next, id, `Orden ${String(o.status).toLowerCase()}`);
  return next;
}
