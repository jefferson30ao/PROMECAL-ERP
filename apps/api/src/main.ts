import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
  });
  await app.listen(Number(process.env.PORT || 3001), "127.0.0.1");
  console.log("PROMECAL REST demo: http://127.0.0.1:3001/api/health");
}
void bootstrap();
