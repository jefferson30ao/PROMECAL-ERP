import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowUpRight, ChevronRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import type {
  Database,
  Entity,
  Resource,
  Value,
} from "../../../../packages/domain/types";
import { money } from "../../../../packages/domain/types";
import { patternStatus } from "../../../../packages/domain/rules";
export function Badge({ value }: { value: Value | undefined }) {
  const s = String(value || "Pendiente");
  const color =
    /Vencido|Urgente|Rechazad|Irreparable|Observado|Suspendido/.test(s)
      ? "red"
      : /Liberad|Pagad|Confirmad|Activo|Vigente|Autorizad|Aceptad|Despachad|Entregado|Cerrada|Validada|Cubierta/.test(
            s,
          )
        ? "green"
        : /proceso|Programada|Reparable|Emitida|Derivado/.test(s)
          ? "blue"
          : "amber";
  return (
    <span className={`badge ${color}`}>
      <i />
      {s}
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">
          {eyebrow || "PROMECAL · ESPACIO DE TRABAJO"}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="title-actions">{children}</div>
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon,
  tone = "green",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <div className={`metric-icon ${tone}`}>{icon}</div>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  to,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  to?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {to && (
          <Link className="text-link" to={to}>
            Ver todo <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  text = "No hay registros para mostrar.",
  children,
}: {
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Inbox size={34} />
      <h3>{text}</h3>
      <p>Prueba con otra búsqueda o registra nueva información.</p>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const before = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          <span className="eyebrow">PROMECAL ERP</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function display(
  db: Database,
  resource: Resource,
  e: Entity,
  key: string,
): ReactNode {
  const field = resource.fields.find((f) => f.key === key);
  if (key === "status")
    return (
      <Badge
        value={resource.key === "standards" ? patternStatus(e) : e.status}
      />
    );
  if (field?.ref) {
    const r = db.records[field.ref]?.find((r) => r.id === e[key]);
    return r ? (
      <span>
        {String(r.name)}
        <small className="cell-sub">{r.id}</small>
      </span>
    ) : (
      "—"
    );
  }
  if (key === "technicianId")
    return String(
      db.records.technicians.find((t) => t.id === e[key])?.name ||
        "Sin asignar",
    );
  if (["amount", "cost"].includes(key)) return money(e[key]);
  if (["due", "date"].includes(key) && e[key])
    return new Date(String(e[key]) + "T12:00:00").toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  if (key === "name")
    return (
      <span className="cell-name">
        {String(e.name)}
        <small className="cell-sub">{e.id}</small>
      </span>
    );
  return String(e[key] ?? "—");
}
export function EntityTable({
  resource,
  rows,
  onOpen,
}: {
  resource: Resource;
  rows: Entity[];
  onOpen: (e: Entity) => void;
}) {
  const { db } = useData();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {resource.columns.map((k) => (
              <th key={k}>
                {resource.fields.find((f) => f.key === k)?.label ||
                  {
                    status: "Estado",
                    technicianId: "Responsable",
                    error: "Error calculado",
                  }[k] ||
                  k}
              </th>
            ))}
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              {resource.columns.map((k, i) => (
                <td key={k}>
                  {i === 0 ? (
                    <button className="row-link" onClick={() => onOpen(e)}>
                      {display(db, resource, e, k)}
                    </button>
                  ) : (
                    display(db, resource, e, k)
                  )}
                </td>
              ))}
              <td>
                <button
                  className="icon-button"
                  aria-label={`Ver ${e.id}`}
                  onClick={() => onOpen(e)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty />}
    </div>
  );
}
import { useData } from "../data/context";
export function download(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
