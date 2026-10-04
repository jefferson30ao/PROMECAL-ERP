import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  CalendarDays,
  FlaskConical,
  Wallet,
  Package,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Handshake,
} from "lucide-react";
import { modules, resources } from "../../../../packages/domain/catalog";
import { money, today } from "../../../../packages/domain/types";
import { paid, patternStatus } from "../../../../packages/domain/rules";
import { useData } from "../data/context";
import { Badge, EntityTable, Metric, PageTitle, Panel } from "../components/ui";
export function Dashboard() {
  const { moduleId } = useParams(),
    { db } = useData(),
    navigate = useNavigate();
  const mod = modules.find((m) => m.id === moduleId),
    orders = db.records.orders;
  const active = orders.filter((o) => o.status !== "Despachada"),
    review = orders.filter((o) => o.status === "En revisión"),
    pending = db.records.payments.filter((p) => p.status === "Por conciliar");
  const balance = orders.reduce(
      (s, o) => s + Math.max(0, Number(o.amount) - paid(db, o.id)),
      0,
    ),
    low = db.records.stock.filter(
      (s) => Number(s.quantity) < Number(s.minimum),
    ),
    expiring = db.records.standards.filter(
      (p) => patternStatus(p) !== "Vigente",
    );
  const moduleResources = resources.filter((r) => r.module === moduleId);
  const counts = mod
    ? [
        {
          label: "Registros del módulo",
          value: moduleResources.reduce(
            (s, r) => s + db.records[r.key].length,
            0,
          ),
          detail: `${moduleResources.length} áreas de trabajo`,
          icon: <ClipboardList size={20} />,
        },
        {
          label:
            mod.id === "comercial"
              ? "Proformas aceptadas"
              : mod.id === "operaciones"
                ? "Servicios en proceso"
                : mod.id === "logistica"
                  ? "Equipos en custodia"
                  : mod.id === "finanzas"
                    ? "Saldo de servicios"
                    : "Patrones vigentes",
          value:
            mod.id === "comercial"
              ? db.records.quotes.filter((q) => q.status === "Aceptada").length
              : mod.id === "operaciones"
                ? orders.filter((o) => o.status === "En proceso").length
                : mod.id === "logistica"
                  ? db.records.equipment.filter((e) => e.status !== "Entregado")
                      .length
                  : mod.id === "finanzas"
                    ? money(balance)
                    : db.records.standards.filter(
                        (p) => patternStatus(p) === "Vigente",
                      ).length,
          detail: "Calculado con los registros actuales",
          icon: <CheckCircle2 size={20} />,
        },
        {
          label: "Requieren atención",
          value:
            mod.id === "calidad"
              ? expiring.length
              : mod.id === "logistica"
                ? low.length
                : mod.id === "finanzas"
                  ? pending.length
                  : mod.id === "operaciones"
                    ? review.length
                    : db.records.requests.filter((r) => r.status === "Nueva")
                        .length,
          detail: "Abre el registro para dar seguimiento",
          icon: <AlertTriangle size={20} />,
        },
      ]
    : [
        {
          label: "Órdenes activas",
          value: active.length,
          detail: `${orders.filter((o) => o.service === "Calibración").length} calibraciones · ${orders.filter((o) => o.service === "Soporte técnico").length} soporte técnico`,
          icon: <ClipboardList size={20} />,
        },
        {
          label: "Equipos en custodia",
          value: db.records.equipment.filter((e) => e.status !== "Entregado")
            .length,
          detail: "Trazabilidad por serie y ubicación",
          icon: <Package size={20} />,
        },
        {
          label: "Saldo de servicios",
          value: money(balance),
          detail: `${pending.length} pago${pending.length === 1 ? "" : "s"} por conciliar`,
          icon: <Wallet size={20} />,
        },
        {
          label: "Por revisar y liberar",
          value: review.length,
          detail: "Documentos pendientes de aprobación",
          icon: <ShieldCheck size={20} />,
        },
      ];
  const alerts = [
    ...expiring.map((p) => ({
      title:
        patternStatus(p) === "Vencido"
          ? "Patrón vencido"
          : "Recalibración próxima",
      text: String(p.name),
      tag: patternStatus(p),
      to: "/modulos/calidad/standards",
    })),
    ...pending.map((p) => ({
      title: "Pago por conciliar",
      text: `${p.name} · ${money(p.amount)}`,
      tag: "Pendiente",
      to: "/modulos/finanzas/payments",
    })),
    ...low.map((p) => ({
      title: "Stock bajo el mínimo",
      text: `${p.name} · ${p.quantity} disponibles`,
      tag: "Reponer",
      to: "/modulos/logistica/stock",
    })),
  ];
  return (
    <>
      <PageTitle
        eyebrow={
          mod
            ? `${mod.code} · RESUMEN DEL MÓDULO`
            : new Date(today() + "T12:00:00")
                .toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
                .toUpperCase() + " · LIMA, PERÚ"
        }
        title={mod ? mod.name : "Una visión clara de tu operación."}
        description={
          mod
            ? mod.description
            : "Bienvenido. Este es el pulso de PROMECAL hoy."
        }
      >
        <Link className="button secondary" to="/planificador">
          <CalendarDays size={16} /> Planificador
        </Link>
        <Link
          className="button primary"
          to={
            mod
              ? `/modulos/${mod.id}/${moduleResources[0].key}?new=1`
              : "/modulos/comercial/requests?new=1"
          }
        >
          <Plus size={17} /> {mod ? "Nuevo registro" : "Nueva solicitud"}
        </Link>
      </PageTitle>
      {!mod && (
        <div className="welcome-banner">
          <div>
            <span className="banner-kicker">
              <span className="live-dot" /> OPERACIÓN CONECTADA
            </span>
            <h2>
              Precisión en cada servicio.
              <br />
              Control en cada etapa.
            </h2>
            <p>
              Comercial, laboratorio y administración,
              <br />
              trabajando con la misma información.
            </p>
            <Link to="/modulos/operaciones/orders">
              Ir a las órdenes de servicio <ArrowRight size={16} />
            </Link>
          </div>
          <div className="banner-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="orbit-center">
              <span>P</span>
              <small>PROMECAL</small>
            </div>
            <span className="orbit-node node-one">
              <Handshake size={23} />
            </span>
            <span className="orbit-node node-two">
              <FlaskConical size={25} />
            </span>
            <span className="orbit-node node-three">
              <ShieldCheck size={22} />
            </span>
            <span className="orbit-node node-four">
              <Package size={22} />
            </span>
            <span className="orbit-node node-five">
              <Wallet size={22} />
            </span>
          </div>
          <span className="banner-label">5 módulos · una operación</span>
        </div>
      )}
      <div className={`metrics ${mod ? "three" : ""}`}>
        {counts.map((c, i) => (
          <Metric
            key={c.label}
            {...c}
            tone={["green", "blue", "purple", "amber"][i]}
          />
        ))}
      </div>
      {mod && (
        <div className="module-resources">
          {moduleResources.map((r) => (
            <Link key={r.key} to={`/modulos/${mod.id}/${r.key}`}>
              <div>
                <FileIcon />
                <span>{db.records[r.key].length} registros</span>
              </div>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      )}
      {!mod && (
        <>
          <div className="dashboard-grid">
            <Panel
              title="Servicios en curso"
              subtitle="Seguimiento de la operación por etapa"
              to="/modulos/operaciones/orders"
            >
              <div className="service-pipeline">
                {[
                  ["Pendiente", "Por programar"],
                  ["Programada", "Programados"],
                  ["En proceso", "En ejecución"],
                  ["En revisión", "En revisión"],
                  ["Liberada", "Por entregar"],
                ].map(([state, label], i) => (
                  <Link
                    key={state}
                    to={`/modulos/operaciones/orders?status=${encodeURIComponent(state)}`}
                  >
                    <span className={`stage-dot dot-${i}`} />
                    <strong>
                      {orders.filter((o) => o.status === state).length}
                    </strong>
                    <span>{label}</span>
                    <div className="mini-track">
                      <i
                        style={{
                          width: `${Math.max(8, (orders.filter((o) => o.status === state).length / orders.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="service-caption">
                <CheckCircle2 size={15} />
                <span>
                  {orders.filter((o) => o.status === "Despachada").length}{" "}
                  servicios despachados
                </span>
                <Link to="/modulos/logistica/dispatches">
                  Ver entregas <ArrowRight size={14} />
                </Link>
              </div>
            </Panel>
            <Panel
              title="Atención prioritaria"
              subtitle={`${alerts.length} asuntos por atender`}
              className="alerts-panel"
            >
              {alerts.slice(0, 3).map((a, i) => (
                <Link className="alert-row" key={i} to={a.to}>
                  <span className={`alert-symbol ${i === 0 ? "danger" : ""}`}>
                    <AlertTriangle size={17} />
                  </span>
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.text}</p>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
              <Link className="all-alerts" to="/actividad">
                Ver todas las alertas <ArrowRight size={14} />
              </Link>
            </Panel>
          </div>
          <Panel
            title="Próximas entregas"
            subtitle="Órdenes y compromisos con tus clientes"
            to="/modulos/operaciones/orders"
          >
            <EntityTable
              resource={{
                ...resources.find((r) => r.key === "orders")!,
                columns: ["name", "clientId", "due", "status"],
              }}
              rows={[...active]
                .sort((a, b) => String(a.due).localeCompare(String(b.due)))
                .slice(0, 4)}
              onOpen={(o) => navigate(`/ordenes/${o.id}`)}
            />
          </Panel>
          <div className="section-label">
            <h2>Tu espacio de trabajo</h2>
            <span>Cinco áreas. Un mismo objetivo.</span>
          </div>
          <div className="module-cards">
            {modules.map((m) => (
              <Link to={`/modulos/${m.id}`} key={m.id}>
                <span
                  className="module-code"
                  style={{ color: m.color, background: m.color + "14" }}
                >
                  {m.code}
                </span>
                <h3>{m.short}</h3>
                <p>{m.description}</p>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </>
      )}
      {mod && (
        <Panel title="Actividad reciente del módulo">
          <div className="timeline">
            {db.events
              .filter((e) =>
                moduleResources.some((r) =>
                  db.records[r.key].some((x) => x.id === e.entityId),
                ),
              )
              .slice(0, 6)
              .map((e) => (
                <div key={e.id}>
                  <Clock3 size={17} />
                  <div>
                    <strong>{e.text}</strong>
                    <p>
                      {e.entityId} · {e.actor}
                    </p>
                  </div>
                </div>
              ))}
            <div>
              <CheckCircle2 size={17} />
              <div>
                <strong>Espacio de {mod.short.toLowerCase()} disponible</strong>
                <p>
                  Selecciona un área para consultar y registrar información.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      )}
      <div className="page-foot">
        <span>PROMECAL S.A.C. · Gestión integrada de servicios</span>
        <span>
          <i className="live-dot" /> Datos de demostración · guardado local
        </span>
      </div>
    </>
  );
}
function FileIcon() {
  return <ClipboardList size={20} />;
}
