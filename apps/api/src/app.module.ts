import { Controller, Get, Inject, Module } from "@nestjs/common";
import { DemoStore, DemoStoreModule } from "./common/demo-store";
import { ComercialModule } from "./modules/comercial/comercial.module";
import { OperacionesModule } from "./modules/operaciones/operaciones.module";
import { LogisticaModule } from "./modules/logistica/logistica.module";
import { FinanzasModule } from "./modules/finanzas/finanzas.module";
import { CalidadModule } from "./modules/calidad/calidad.module";
@Controller()
class AppController {
  constructor(@Inject(DemoStore) private readonly store: DemoStore) {}
  @Get("health") health() {
    return {
      status: "ok",
      mode: "demo-memory",
      databaseConnected: false,
      modules: ["M1", "M2", "M3", "M4", "M5"],
    };
  }
  @Get("demo/snapshot") snapshot() {
    return this.store.snapshot();
  }
}
@Module({
  imports: [
    DemoStoreModule,
    ComercialModule,
    OperacionesModule,
    LogisticaModule,
    FinanzasModule,
    CalidadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
