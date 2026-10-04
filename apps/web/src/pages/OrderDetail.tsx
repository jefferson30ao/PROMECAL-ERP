import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Package,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useData } from "../data/context";
import { Badge, PageTitle, Panel, EntityTable } from "../components/ui";
import { EntityForm } from "../components/EntityForm";
import { resources } from "../../../../packages/domain/catalog";
import {
  advanceOrder,
  financialReason,
  logEvent,
  paid,
  related,
  technicalReason,
  transitions,
  transitionReason,
} from "../../../../packages/domain/rules";
import { money, today } from "../../../../packages/domain/types";
export function OrderDetail() {
  const { id } = useParams(),
    { db, commit, toast } = useData();
  const order = db.records.orders.find((o) => o.id === id),
    [tab, setTab] = useState("Resumen"),
    [form, setForm] = useState(""),
    [error, setError] = useState("");
  if (!order)
    return (
      <PageTitle
        title="Orden no encontrada"
        description="Regresa a la lista de órdenes."
      />
    );
  const client = db.records.clients.find((c) => c.id === order.clientId),
    equipment = db.records.equipment.find((e) => e.id === order.equipmentId);
  const reason = transitionReason(db, order),
    techReason = technicalReason(db, order);
  async function update(patch: Record<string, string | boolean>) {
    const next = structuredClone(db),
      o = next.records.orders.find((o) => o.id === id)!;
    Object.assign(o, patch);
    logEvent(next, id!, "Expediente actualizado");
    try {
      await commit(next);
      setError("");
      toast("Expediente actualizado");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function advance() {
    try {
      await commit(advanceOrder(db, id!));
      toast("Etapa completada y trazabilidad actualizada");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function diagnosisOnly() {
    const diagnosis = related(db, "diagnoses", id!).find(
      (d) => d.status === "Irreparable" || d.decision === "Rechazado",
    );
    if (!diagnosis) {
      setError(
        "Registra un diagnóstico irreparable o la decisión de rechazo del cliente.",
      );
      return;
    }
    const next = structuredClone(db),
      o = next.records.orders.find((o) => o.id === id)!;
    if (!["Pendiente", "Programada"].includes(String(o.status))) {
      setError("Solo diagnóstico se aplica antes de iniciar la reparación.");
      return;
    }
    o.amount = diagnosis.amount;
    o.status = "Liberada";
    o.diagnosisOnly = true;
    next.records.quotes.push({
      id: `PRO-DIA-${Date.now()}`,
      name: "Servicio de diagnóstico",
      clientId: o.clientId,
      orderId: o.id,
      service: "Solo diagnóstico",
      amount: diagnosis.amount,
      status: "Borrador",
      deliverable: "Informe de diagnóstico",
      due: today(),
      deliveryDays: 1,
      conditions:
        "Diagnóstico previo con costo. Pendiente de formalización comercial.",
    });
    next.records.certificates.push({
      id: `DOC-DIA-${Date.now()}`,
      name: "Informe de diagnóstico",
      orderId: o.id,
      date: today(),
      reviewer: "Servicio técnico · Demo",
      status: "Liberado",
    });
    const eq = next.records.equipment.find((e) => e.id === o.equipmentId);
    if (eq) {
      eq.status = "Listo para entrega";
      eq.location = "Despacho · D1";
    }
    logEvent(
      next,
      o.id,
      "Rama solo diagnóstico: proforma creada, pendiente de pedido y cobro",
    );
    try {
      await commit(next);
      toast(
        "Se generó la proforma de diagnóstico. Completa aceptación, pedido y cobro.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const labels = [
    "Pendiente",
    "Programada",
    "En proceso",
    "En revisión",
    "Liberada",
    "Despachada",
  ];
  const actions: Record<string, string> = {
    Pendiente: "Programar servicio",
    Programada: "Iniciar servicio",
    "En proceso": "Enviar a revisión",
    "En revisión": "Liberar documento",
    Liberada: "Confirmar despacho",
  };
  const tabResources: Record<string, string[]> = {
    Comercial: ["quotes", "notes"],
    Resultados: ["diagnoses", "results"],
    Documentos: ["receipts", "certificates", "dispatches"],
    Finanzas: ["payments", "invoices", "costs"],
    Calidad: ["nonconformities"],
  };
  return (
    <>
      <Link to="/modulos/operaciones/orders" className="back-link">
        <ArrowLeft size={15} /> Todas las órdenes
      </Link>
      <PageTitle
        eyebrow={`${order.service === "Calibración" ? "ORDEN DE SERVICIO" : "ORDEN DE TRABAJO"} · ${id}`}
        title={String(order.name)}
        description={`${client?.name} · Serie ${equipment?.serial}`}
      >
        <Badge value={order.status} />
        <Badge value={order.priority} />
        {["Pendiente", "Programada"].includes(String(order.status)) && (
          <button
            className="button secondary"
            onClick={() => setForm("orders")}
          >
            Editar orden
          </button>
        )}
      </PageTitle>
      <div className="workflow">
        {labels.map((s, i) => (
          <div
            key={s}
            className={i <= labels.indexOf(String(order.status)) ? "done" : ""}
          >
            <span>
              {i < labels.indexOf(String(order.status)) ? (
                <Check size={15} />
              ) : (
                i + 1
              )}
            </span>
            <b>{s}</b>
            {i < 5 && <i />}
          </div>
        ))}
      </div>
      <div className="tabs">
        {[
          "Resumen",
          "Comercial",
          "Resultados",
          "Documentos",
          "Finanzas",
          "Calidad",
          "Historial",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {tab === "Resumen" ? (
        <div className="order-layout">
          <div>
            <Panel
              title="Información del servicio"
              subtitle="Un expediente compartido por las cinco áreas"
            >
              <dl className="detail-grid">
                <div>
                  <dt>Cliente</dt>
                  <dd>
                    {client?.name}
                    <small>{client?.document}</small>
                  </dd>
                </div>
                <div>
                  <dt>Instrumento</dt>
                  <dd>
                    {equipment?.brand} {equipment?.model}
                    <small>{equipment?.serial}</small>
                  </dd>
                </div>
                <div>
                  <dt>Servicio y magnitud</dt>
                  <dd>
                    {order.service} · {order.magnitude}
                  </dd>
                </div>
                <div>
                  <dt>Ubicación actual</dt>
                  <dd>{equipment?.location}</dd>
                </div>
                <div>
                  <dt>Entrega prevista</dt>
                  <dd>{String(order.due)}</dd>
                </div>
                <div>
                  <dt>Importe del servicio</dt>
                  <dd>
                    {money(order.amount)} <small>{client?.payment}</small>
                  </dd>
                </div>
              </dl>
              <div className="order-notes">{order.notes}</div>
            </Panel>
            <Panel
              title="Asignación y programación"
              subtitle="Competencias y patrones controlados por Calidad"
            >
              <div className="form-grid padded">
                <label>
                  Técnico responsable
                  <select
                    disabled={
                      !["Pendiente", "Programada"].includes(
                        String(order.status),
                      )
                    }
                    value={String(order.technicianId || "")}
                    onChange={(e) =>
                      void update({ technicianId: e.target.value })
                    }
                  >
                    <option value="">Seleccionar técnico</option>
                    {db.records.technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.magnitude}
                      </option>
                    ))}
                  </select>
                </label>
                {order.service === "Calibración" && (
                  <label>
                    Patrón de referencia
                    <select
                      disabled={
                        !["Pendiente", "Programada"].includes(
                          String(order.status),
                        )
                      }
                      value={String(order.standardId || "")}
                      onChange={(e) =>
                        void update({ standardId: e.target.value })
                      }
                    >
                      <option value="">Seleccionar patrón</option>
                      {db.records.standards.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.due}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Fecha programada
                  <input
                    type="date"
                    value={String(order.scheduledDate || order.due)}
                    disabled={
                      !["Pendiente", "Programada"].includes(
                        String(order.status),
                      )
                    }
                    onChange={(e) =>
                      void update({ scheduledDate: e.target.value })
                    }
                  />
                </label>
              </div>
              {techReason && <p className="inline-warning">{techReason}</p>}
            </Panel>
            {order.status === "En revisión" && (
              <Panel
                title="Revisión y autorización"
                subtitle="CAL-PR-06 · revisión técnica previa a la emisión"
              >
                <div className="padded check-list">
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(order.reviewed)}
                      onChange={(e) =>
                        void update({ reviewed: e.target.checked })
                      }
                    />{" "}
                    Resultados revisados por el responsable de laboratorio
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(order.signed)}
                      onChange={(e) =>
                        void update({ signed: e.target.checked })
                      }
                    />{" "}
                    Registrar firma de demostración
                  </label>
                  <p className="muted">
                    La firma electrónica y los cálculos metrológicos definitivos
                    se integrarán en una etapa posterior.
                  </p>
                </div>
              </Panel>
            )}
            {order.status === "Liberada" && (
              <Panel
                title="Datos de entrega"
                subtitle="Conformidad y responsable de recojo"
              >
                <form
                  className="padded"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void update({
                      recipient: String(f.get("recipient")),
                      deliveryReference: String(f.get("deliveryReference")),
                    });
                  }}
                >
                  <div className="form-grid">
                    <label>
                      Responsable del recojo
                      <input
                        name="recipient"
                        required
                        defaultValue={String(order.recipient || "")}
                      />
                    </label>
                    <label>
                      Guía / acta de entrega
                      <input
                        name="deliveryReference"
                        required
                        defaultValue={String(order.deliveryReference || "")}
                      />
                    </label>
                  </div>
                  <button className="button secondary spacing-top">
                    Guardar datos de entrega
                  </button>
                </form>
              </Panel>
            )}
          </div>
          <aside>
            <Panel title="Siguiente paso">
              <div className="padded next-step">
                <div className="step-icon">
                  <ArrowRight size={22} />
                </div>
                <h3>
                  {actions[String(order.status)] || "Servicio completado"}
                </h3>
                <p>
                  {reason || "Los controles de esta etapa están conformes."}
                </p>
                {transitions[String(order.status)] && (
                  <button
                    className="button primary full-width"
                    onClick={advance}
                    disabled={Boolean(reason)}
                  >
                    {actions[String(order.status)]}
                    <ArrowRight size={16} />
                  </button>
                )}
                <div className="divider" />
                <p className="tiny">
                  Los cambios de etapa generan registros vinculados y actualizan
                  la ubicación del equipo.
                </p>
              </div>
            </Panel>
            <Panel title="Control financiero">
              <div className="padded">
                <div className="balance-row">
                  <span>Importe</span>
                  <b>{money(order.amount)}</b>
                </div>
                <div className="balance-row">
                  <span>Conciliado</span>
                  <b>{money(paid(db, id!))}</b>
                </div>
                <div className="balance-row total">
                  <span>Saldo</span>
                  <b>
                    {money(Math.max(0, Number(order.amount) - paid(db, id!)))}
                  </b>
                </div>
                <p className="tiny">
                  {financialReason(db, order, true) ||
                    "Condición financiera habilitada para entrega."}
                </p>
                <button
                  className="button secondary full-width"
                  onClick={() => setForm("payments")}
                >
                  <Wallet size={16} /> Registrar pago
                </button>
              </div>
            </Panel>
            <Panel title="Acciones relacionadas">
              <div className="quick-actions">
                <button onClick={() => setForm("receipts")}>
                  <Package size={17} /> Registrar recepción <Plus size={14} />
                </button>
                <button onClick={() => setForm("results")}>
                  <FileText size={17} /> Capturar resultados <Plus size={14} />
                </button>
                <button onClick={() => setForm("nonconformities")}>
                  <ShieldCheck size={17} /> Registrar no conformidad{" "}
                  <Plus size={14} />
                </button>
                {order.service === "Soporte técnico" && (
                  <>
                    <button onClick={() => setForm("diagnoses")}>
                      <FileText size={17} /> Registrar diagnóstico{" "}
                      <Plus size={14} />
                    </button>
                    <button onClick={() => void diagnosisOnly()}>
                      <CheckCircle2 size={17} /> Cobrar solo diagnóstico{" "}
                      <ArrowRight size={14} />
                    </button>
                  </>
                )}
              </div>
            </Panel>
          </aside>
        </div>
      ) : tab === "Historial" ? (
        <Panel title="Trazabilidad de la orden">
          <div className="timeline">
            {db.events
              .filter(
                (e) =>
                  e.entityId === id ||
                  Object.values(db.records)
                    .flat()
                    .some((r) => r.id === e.entityId && r.orderId === id),
              )
              .map((e) => (
                <div key={e.id}>
                  <Clock3 size={17} />
                  <div>
                    <strong>{e.text}</strong>
                    <p>
                      {e.actor} · {new Date(e.at).toLocaleString("es-PE")}
                    </p>
                  </div>
                </div>
              ))}
            <div>
              <CheckCircle2 size={17} />
              <div>
                <strong>Ingreso del servicio</strong>
                <p>{order.date} · Recepción</p>
              </div>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="stack">
          {tabResources[tab]?.map((key) => {
            const r = resources.find((r) => r.key === key)!;
            const rows =
              key === "quotes"
                ? db.records.quotes.filter(
                    (q) =>
                      q.orderId === id ||
                      related(db, "notes", id!).some((n) => n.quoteId === q.id),
                  )
                : related(db, key, id!);
            return (
              <Panel key={key} title={r.title}>
                <div className="table-action">
                  {!r.readonly && (
                    <button
                      className="button secondary"
                      onClick={() => setForm(key)}
                    >
                      <Plus size={15} /> Registrar {r.singular}
                    </button>
                  )}
                </div>
                {key === "certificates" &&
                order.service === "Soporte técnico" &&
                client?.payment === "Contado" &&
                paid(db, id!) < Number(order.amount) ? (
                  <div className="notice">
                    El informe de soporte estará disponible para entrega al
                    cliente después de confirmar el pago.
                  </div>
                ) : (
                  <EntityTable
                    resource={r}
                    rows={rows}
                    onOpen={() => {
                      window.location.hash = `/modulos/${r.module}/${r.key}?q=${id}`;
                    }}
                  />
                )}
              </Panel>
            );
          })}
        </div>
      )}
      {form && (
        <EntityForm
          resource={resources.find((r) => r.key === form)!}
          entity={form === "orders" ? order : undefined}
          defaults={{ orderId: id!, clientId: String(order.clientId) }}
          onClose={() => setForm("")}
        />
      )}
    </>
  );
}
