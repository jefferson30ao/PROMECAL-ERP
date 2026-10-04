import { Module } from "@nestjs/common";
import { resourceController } from "../../common/resource-controller";
@Module({ controllers: [resourceController("finanzas")] })
export class FinanzasModule {}
