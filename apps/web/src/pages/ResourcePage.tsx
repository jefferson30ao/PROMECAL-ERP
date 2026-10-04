import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Pencil,
  FileText,
} from "lucide-react";
import { resources, modules } from "../../../../packages/domain/catalog";
import {
  patternStatus,
  createWarrantyOrder,
} from "../../../../packages/domain/rules";
import type { Entity } from "../../../../packages/domain/types";
import { useData } from "../data/context";
import {
  EntityTable,
  PageTitle,
  Modal,
  display,
  download,
  Badge,
} from "../components/ui";
import { EntityForm } from "../components/EntityForm";
export function ResourcePage() {
  const { key } = useParams(),
    navigate = useNavigate(),
    { db, commit, toast } = useData(),
    [params] = useSearchParams();
  const resource = resources.find((r) => r.key === key)!;
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("Todos"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<Entity | null>(null),
    [form, setForm] = useState<null | Entity | "new">(null);
  useEffect(() => {
    setSearch(params.get("q") || "");
    setStatus(params.get("status") || "Todos");
    setPage(1);
    setSelected(null);
    setForm(params.get("new") === "1" ? "new" : null);
  }, [key, params]);
  if (!resource)
    return (
      <PageTitle
        title="Página no encontrada"
        description="Selecciona una sección en el menú."
      />
    );
  const module = modules.find((m) => m.id === resource.module)!;
  const records = db.records[resource.key] || [];
  const states =
    resource.key === "standards"
      ? ["Vigente", "Por vencer", "Vencido"]
      : resource.states || [];
  const filtered = records.filter(
    (r) =>
      (status === "Todos" ||
        (resource.key === "standards" ? patternStatus(r) : r.status) ===
          status) &&
      Object.values(r)
        .concat(
          resource.fields
            .filter((f) => f.ref)
            .map((f) =>
              String(
                db.records[f.ref!]?.find((e) => e.id === r[f.key])?.name || "",
              ),
            ),
        )
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const open = (e: Entity) =>
    resource.key === "orders" ? navigate(`/ordenes/${e.id}`) : setSelected(e);
  const exportCSV = () => {
    const cols = ["id", ...resource.fields.map((f) => f.key), "status"];
    const escape = (v: unknown) => {
      let s = String(v ?? "");
      if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    download(
      `${resource.key}.csv`,
      "\uFEFF" +
        [cols, ...filtered.map((r) => cols.map((c) => r[c]))]
          .map((row) => row.map(escape).join(";"))
          .join("\r\n"),
      "text/csv;charset=utf-8",
    );
  };
  return (
    <>
      <PageTitle
        eyebrow={`${module.code} · ${module.name}`}
        title={resource.title}
        description={resource.description}
      >
        <button className="button secondary" onClick={exportCSV}>
          <Download size={16} /> Exportar
        </button>
        {!resource.readonly && (
          <button className="button primary" onClick={() => setForm("new")}>
            <Plus size={17} /> Nuevo registro
          </button>
        )}
      </PageTitle>
      {resource.key === "orders" && (
        <div className="order-summary">
          {[
            "Pendiente",
            "Programada",
            "En proceso",
            "En revisión",
            "Liberada",
            "Despachada",
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(status === s ? "Todos" : s);
                setPage(1);
              }}
              className={status === s ? "selected" : ""}
            >
              <span>{s}</span>
              <strong>{records.filter((r) => r.status === s).length}</strong>
            </button>
          ))}
        </div>
      )}
      {resource.key === "standards" && (
        <div className="notice">
          Los patrones vencidos se bloquean automáticamente al programar,
          iniciar y liberar una calibración.
        </div>
      )}
      {resource.readonly && (
        <div className="notice">
          {resource.key === "dispatches"
            ? "El despacho se registra desde el expediente de una orden liberada, después de verificar pago, factura y datos de recojo."
            : "Los documentos se generan al liberar la orden, después de revisar y aprobar sus resultados."}{" "}
          <Link to="/modulos/operaciones/orders">Ir a órdenes →</Link>
        </div>
      )}
      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="Buscar registros"
              placeholder={`Buscar ${resource.title.toLowerCase()}…`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="filter-group">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option>Todos</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className="count">{filtered.length} registros</span>
          </div>
        </div>
        <EntityTable
          resource={resource}
          rows={filtered.slice((page - 1) * 8, page * 8)}
          onOpen={open}
        />
        <div className="pagination">
          <span>
            {filtered.length
              ? `${(page - 1) * 8 + 1}–${Math.min(page * 8, filtered.length)}`
              : "0"}{" "}
            de {filtered.length} registros
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>
              Página {page} de {pages}
            </span>
            <button
              className="icon-button"
              aria-label="Página siguiente"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      {selected && (
        <Modal
          title={String(selected.name)}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="detail-body">
            <div className="detail-id">
              <FileText size={20} />
              {selected.id}
              <Badge
                value={
                  resource.key === "standards"
                    ? patternStatus(selected)
                    : selected.status
                }
              />
            </div>
            <dl className="detail-grid">
              {resource.fields.map((f) => (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>
                    {display(db, resource, selected, f.key)}
                    {f.ref && selected[f.key] && (
                      <Link
                        className="text-link"
                        to={
                          f.ref === "orders"
                            ? `/ordenes/${selected[f.key]}`
                            : `/modulos/${resources.find((r) => r.key === f.ref)?.module}/${f.ref}?q=${selected[f.key]}`
                        }
                      >
                        Abrir registro →
                      </Link>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {resource.key === "clients" && (
              <div className="notice">
                <Link to={`/modulos/operaciones/orders?q=${selected.id}`}>
                  Consultar órdenes e historial del cliente →
                </Link>
              </div>
            )}
            {resource.key === "certificates" && (
              <div className="notice">
                Vista de demostración. No es un certificado metrológico ni
                incluye firma electrónica válida.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() =>
                download(
                  `${selected.id}.txt`,
                  `PROMECAL · DOCUMENTO DE DEMOSTRACIÓN\n${Object.entries(
                    selected,
                  )
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")}`,
                )
              }
            >
              Descargar ficha
            </button>
            {resource.key === "warranties" &&
              selected.status === "Cubierta" && (
                <button
                  className="button secondary"
                  onClick={async () => {
                    try {
                      const next = createWarrantyOrder(db, selected.id);
                      await commit(next);
                      setSelected(null);
                      navigate(`/ordenes/${next.records.orders[0].id}`);
                      toast("Atención y nota de garantía creadas");
                    } catch (e) {
                      toast((e as Error).message);
                    }
                  }}
                >
                  Crear atención cubierta
                </button>
              )}
            {!resource.readonly && !resource.immutable && (
              <button
                className="button primary"
                onClick={() => {
                  setForm(selected);
                  setSelected(null);
                }}
              >
                <Pencil size={15} /> Editar registro
              </button>
            )}
          </div>
        </Modal>
      )}
      {form && (
        <EntityForm
          resource={resource}
          entity={form === "new" ? undefined : form}
          defaults={
            params.get("orderId") ? { orderId: params.get("orderId")! } : {}
          }
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}
