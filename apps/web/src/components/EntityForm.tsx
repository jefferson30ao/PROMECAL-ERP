import { useState, type FormEvent } from "react";
import type {
  Entity,
  Field,
  Resource,
} from "../../../../packages/domain/types";
import { today } from "../../../../packages/domain/types";
import { saveEntity } from "../../../../packages/domain/rules";
import { useData } from "../data/context";
import { Modal } from "./ui";
export function EntityForm({
  resource,
  entity,
  onClose,
  defaults = {},
}: {
  resource: Resource;
  entity?: Entity;
  onClose: () => void;
  defaults?: Partial<Entity>;
}) {
  const { db, commit, toast } = useData();
  const [values, setValues] = useState<Entity>(() =>
    entity
      ? { ...entity }
      : Object.assign(
          { id: `${resource.prefix}-${Date.now().toString().slice(-7)}` },
          Object.fromEntries(
            resource.fields.map((f) => [
              f.key,
              f.type === "date"
                ? today()
                : f.type === "number"
                  ? 0
                  : f.type === "select" && !f.ref
                    ? f.options?.[0] || ""
                    : "",
            ]),
          ),
          resource.states ? { status: resource.states[0] } : {},
          defaults,
        ),
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const fields: Field[] = [
    ...resource.fields,
    ...(resource.states && resource.key !== "orders"
      ? [
          {
            key: "status",
            label: "Estado",
            type: "select" as const,
            options: resource.states,
            required: true,
          },
        ]
      : []),
  ];
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await commit(
        saveEntity(
          db,
          resource.key,
          resource.key === "orders" && !entity
            ? {
                ...values,
                id:
                  values.service === "Soporte técnico"
                    ? values.id.replace(/^OS-/, "OT-")
                    : values.id,
              }
            : values,
        ),
      );
      toast(
        `${entity ? "Actualización guardada" : "Registro creado"} · ${values.id}`,
      );
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${entity ? "Editar" : "Registrar"} ${resource.singular}`}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-intro">{resource.description}</div>
        <div className="form-grid">
          {fields.map((f) => (
            <label key={f.key} className={f.type === "textarea" ? "full" : ""}>
              {f.label}
              {f.required && <span className="required"> *</span>}
              {f.type === "select" ? (
                <select
                  aria-label={f.label}
                  required={f.required}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                >
                  <option value="">Seleccionar…</option>
                  {f.ref
                    ? db.records[f.ref]?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} · {r.name}
                        </option>
                      ))
                    : f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  aria-label={f.label}
                  required={f.required}
                  rows={3}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                />
              ) : (
                <input
                  aria-label={f.label}
                  type={f.type || "text"}
                  required={f.required}
                  step={f.type === "number" ? "any" : undefined}
                  min={
                    f.type === "number" &&
                    !["reading", "reference"].includes(f.key)
                      ? 0
                      : undefined
                  }
                  value={String(values[f.key] ?? "")}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [f.key]:
                        f.type === "number" && e.target.value !== ""
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              )}
            </label>
          ))}
        </div>
        {error && (
          <div role="alert" className="form-error">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <span>* Campos obligatorios</span>
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
