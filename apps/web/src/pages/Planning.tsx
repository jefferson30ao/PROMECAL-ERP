import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import { useData } from "../data/context";
import { PageTitle, Badge, Panel } from "../components/ui";
import { type Entity, money, today } from "../../../../packages/domain/types";
import { paid, patternStatus } from "../../../../packages/domain/rules";
export function Planning() {
  const { db } = useData(),
    [offset, setOffset] = useState(0),
    [magnitude, setMagnitude] = useState("Todas");
  const base = new Date(today() + "T12:00:00");
  base.setDate(
    base.getDate() +
      (base.getDay() === 0 ? 1 : -((base.getDay() + 6) % 7)) +
      offset * 7,
  );
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d;
  });
  return (
    <>
      <PageTitle
        eyebrow="M2 · OPERACIONES DE SERVICIO"
        title="Programa de calibración"
        description="Organiza la carga del laboratorio por técnico y magnitud."
      >
        <Link className="button primary" to="/modulos/operaciones/orders">
          Asignar desde una orden <ArrowUpRight size={16} />
        </Link>
      </PageTitle>
      <section className="panel">
        <div className="toolbar">
          <div className="calendar-controls">
            <CalendarDays size={18} />
            <b>
              {dates[0].toLocaleDateString("es-PE", {
                month: "long",
                year: "numeric",
              })}
            </b>
            <button
              aria-label="Semana anterior"
              className="icon-button"
              onClick={() => setOffset(offset - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button className="button secondary" onClick={() => setOffset(0)}>
              Hoy
            </button>
            <button
              aria-label="Semana siguiente"
              className="icon-button"
              onClick={() => setOffset(offset + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <select
            aria-label="Filtrar por magnitud"
            value={magnitude}
            onChange={(e) => setMagnitude(e.target.value)}
          >
            {["Todas", "Eléctrica", "Presión", "Temperatura", "Fotometría"].map(
              (m) => (
                <option key={m}>{m}</option>
              ),
            )}
          </select>
        </div>
        <div className="calendar-scroll">
          <div className="calendar">
            <div className="calendar-heading">Técnico / magnitud</div>
            {dates.map((d) => (
              <div key={String(d)} className="calendar-heading">
                <span>
                  {d.toLocaleDateString("es-PE", { weekday: "short" })}
                </span>
                <strong>{d.getDate()}</strong>
              </div>
            ))}
            {db.records.technicians
              .filter((t) => magnitude === "Todas" || t.magnitude === magnitude)
              .map((t) => (
                <div className="calendar-row" key={t.id}>
                  <div className="tech-label">
                    <span className="avatar">
                      {String(t.name)
                        .split(" ")
                        .map((s) => s[0])
                        .join("")}
                    </span>
                    <b>{t.name}</b>
                    <small>{t.magnitude}</small>
                  </div>
                  {dates.map((d) => {
                    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    return (
                      <div className="calendar-cell" key={ds}>
                        {db.records.orders
                          .filter(
                            (o) =>
                              o.technicianId === t.id &&
                              (o.scheduledDate || o.due) === ds &&
                              o.status !== "Despachada",
                          )
                          .map((o) => (
                            <Link
                              className="appointment"
                              to={`/ordenes/${o.id}`}
                              key={o.id}
                            >
                              <span>{o.id}</span>
                              <b>{o.name}</b>
                              <small>{o.status}</small>
                            </Link>
                          ))}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </section>
      <div className="notice">
        Selecciona una orden para cambiar su técnico, patrón o fecha de
        programación. La autorización por magnitud se comprueba antes de
        avanzar.
      </div>
    </>
  );
}
export function Activity() {
  const { db } = useData();
  return (
    <>
      <PageTitle
        title="Centro de actividad"
        description="Alertas operativas y trazabilidad de los registros."
      />
      <div className="two-columns">
        <Panel title="Requieren tu atención">
          <div className="padded stack">
            {db.records.standards
              .filter((s) => patternStatus(s) !== "Vigente")
              .map((s) => (
                <Link
                  className="notice"
                  to="/modulos/calidad/standards"
                  key={s.id}
                >
                  {s.name} <Badge value={patternStatus(s)} />
                </Link>
              ))}
            {db.records.stock
              .filter((s) => Number(s.quantity) < Number(s.minimum))
              .map((s) => (
                <Link
                  className="notice"
                  to="/modulos/logistica/stock"
                  key={s.id}
                >
                  {s.name}: {s.quantity} disponibles, mínimo {s.minimum}
                </Link>
              ))}
            {db.records.payments
              .filter((p) => p.status === "Por conciliar")
              .map((p) => (
                <Link
                  className="notice"
                  to="/modulos/finanzas/payments"
                  key={p.id}
                >
                  {p.name} · {money(p.amount)} por conciliar
                </Link>
              ))}
          </div>
        </Panel>
        <Panel title="Últimos movimientos">
          <div className="timeline">
            {db.events.slice(0, 20).map((e) => (
              <div key={e.id}>
                <span className="event-dot" />
                <div>
                  <strong>{e.text}</strong>
                  <p>
                    {e.entityId} · {e.actor}
                  </p>
                  <small>{new Date(e.at).toLocaleString("es-PE")}</small>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
export function Receivables() {
  const { db } = useData();
  const rows = db.records.orders
    .map(
      (o) =>
        ({
          ...o,
          balance: Math.max(0, Number(o.amount) - paid(db, o.id)),
        }) as Entity & { balance: number },
    )
    .filter((o) => o.balance > 0);
  return (
    <>
      <PageTitle
        eyebrow="M4 · FINANZAS Y FACTURACIÓN"
        title="Cuentas por cobrar"
        description="Saldos de servicio calculados con los pagos confirmados."
      />
      <Panel
        title={`${money(rows.reduce((s, o) => s + o.balance, 0))} por cobrar`}
        subtitle="Incluye servicios en curso aún no facturados"
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Condición</th>
                <th>Importe</th>
                <th>Confirmado</th>
                <th>Saldo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link className="text-link" to={`/ordenes/${o.id}`}>
                      {o.id}
                    </Link>
                  </td>
                  <td>
                    {db.records.clients.find((c) => c.id === o.clientId)?.name}
                  </td>
                  <td>
                    {
                      db.records.clients.find((c) => c.id === o.clientId)
                        ?.payment
                    }
                  </td>
                  <td>{money(o.amount)}</td>
                  <td>{money(paid(db, o.id))}</td>
                  <td>
                    <b>{money(o.balance)}</b>
                  </td>
                  <td>
                    <Link
                      to={`/modulos/finanzas/payments?new=1&orderId=${o.id}`}
                      className="text-link"
                    >
                      Registrar pago →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
