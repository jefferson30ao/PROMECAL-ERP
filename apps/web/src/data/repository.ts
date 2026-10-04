import type { Database, Repository } from "../../../../packages/domain/types";
import { createSeed } from "../../../../packages/domain/seed";
import { resources } from "../../../../packages/domain/catalog";
export class LocalRepository implements Repository {
  readonly key = "promecal.erp.v1";
  async load() {
    const raw = localStorage.getItem(this.key);
    if (!raw) return createSeed();
    try {
      const db = JSON.parse(raw) as Database;
      if (db.version !== 1 || !db.records.orders) throw Error();
      for (const resource of resources) {
        if (!db.records[resource.key]) db.records[resource.key] = [];
        if (!Array.isArray(db.records[resource.key])) throw Error();
      }
      if (!Array.isArray(db.events)) throw Error();
      return db;
    } catch {
      throw new Error(
        "No se pudieron leer los datos locales. Exporta un respaldo del almacenamiento antes de restablecer la demostración.",
      );
    }
  }
  async save(db: Database) {
    localStorage.setItem(this.key, JSON.stringify(db));
  }
}
// Puerto preparado para un repositorio REST; no se activa hasta contar con persistencia real.
export class HttpResourceClient {
  constructor(private baseUrl: string) {}
  async load(): Promise<Database> {
    const r = await fetch(`${this.baseUrl}/api/demo/snapshot`);
    if (!r.ok) throw Error("No se pudo cargar el ERP.");
    return r.json();
  }
  async saveResource(
    module: string,
    resource: string,
    body: unknown,
    id?: string,
  ) {
    const r = await fetch(
      `${this.baseUrl}/api/${module}/${resource}${id ? "/" + id : ""}`,
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!r.ok) {
      const error = await r.json();
      throw Error(error.message || "No se pudo guardar.");
    }
    return r.json();
  }
}
export const repository: Repository = new LocalRepository();
