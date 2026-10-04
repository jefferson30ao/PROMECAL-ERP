import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { DemoStore } from "./demo-store";
// Cada controlador publica únicamente recursos de su módulo. El almacén en memoria
// se sustituirá por repositorios Prisma manteniendo las reglas de dominio compartidas.
export function resourceController(module: string) {
  @Controller(module)
  class ResourceController {
    constructor(@Inject(DemoStore) private readonly store: DemoStore) {}
    @Get(":resource") list(@Param("resource") resource: string) {
      return this.store.list(module, resource);
    }
    @Post(":resource") create(
      @Param("resource") resource: string,
      @Body() body: unknown,
    ) {
      return this.store.save(module, resource, body);
    }
    @Patch(":resource/:id") update(
      @Param("resource") resource: string,
      @Param("id") id: string,
      @Body() body: unknown,
    ) {
      return this.store.save(module, resource, body, id);
    }
  }
  return ResourceController;
}
