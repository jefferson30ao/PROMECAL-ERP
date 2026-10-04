import { Controller, Inject, Module, Param, Post } from "@nestjs/common";
import { resourceController } from "../../common/resource-controller";
import { DemoStore } from "../../common/demo-store";
@Controller("operaciones/orders")
class WorkflowController {
  constructor(@Inject(DemoStore) private readonly store: DemoStore) {}
  @Post(":id/advance") advance(@Param("id") id: string) {
    return this.store.advance(id);
  }
}
@Module({
  controllers: [resourceController("operaciones"), WorkflowController],
})
export class OperacionesModule {}
