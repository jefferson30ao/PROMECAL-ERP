import {
  BadRequestException,
  Global,
  Injectable,
  Module,
  NotFoundException,
} from "@nestjs/common";
import { createSeed } from "../../../../packages/domain/seed";
import { saveEntity, advanceOrder } from "../../../../packages/domain/rules";
import { resources } from "../../../../packages/domain/catalog";
import type { Entity } from "../../../../packages/domain/types";
@Injectable()
export class DemoStore {
  private db = createSeed();
  snapshot() {
    return structuredClone(this.db);
  }
  list(module: string, key: string) {
    this.assertResource(module, key);
    return structuredClone(this.db.records[key]);
  }
  save(module: string, key: string, body: unknown, id?: string) {
    this.assertResource(module, key);
    const config = resources.find((r) => r.key === key)!;
    if (config.readonly)
      throw new BadRequestException(
        "Registro generado por el flujo de la orden.",
      );
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new BadRequestException("Objeto requerido.");
    const data = body as Record<string, unknown>;
    if (
      Object.values(data).some(
        (v) => !["string", "number", "boolean"].includes(typeof v),
      )
    )
      throw new BadRequestException("Valores inválidos.");
    const existing = id
      ? this.db.records[key].find((r) => r.id === id)
      : undefined;
    if (id && !existing) throw new NotFoundException("Registro no encontrado.");
    const allowed = new Set(config.fields.map((f) => f.key).concat("status"));
    const clean = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.has(k)),
    );
    const entity = {
      ...(config.states ? { status: config.states[0] } : {}),
      ...existing,
      ...clean,
      id: id || `${config.prefix}-${crypto.randomUUID().slice(0, 8)}`,
    } as Entity;
    if (key === "orders") entity.status = existing?.status || "Pendiente";
    try {
      this.db = saveEntity(this.db, key, entity);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
    return this.db.records[key].find((r) => r.id === entity.id);
  }
  advance(id: string) {
    try {
      this.db = advanceOrder(this.db, id);
      return this.db.records.orders.find((o) => o.id === id);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }
  private assertResource(module: string, key: string) {
    if (!resources.some((r) => r.module === module && r.key === key))
      throw new NotFoundException("Recurso fuera del módulo.");
  }
}
@Global()
@Module({ providers: [DemoStore], exports: [DemoStore] })
export class DemoStoreModule {}
