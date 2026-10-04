import "reflect-metadata";
import { existsSync } from "fs";
import { resolve, join } from "path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  });

  const candidates = [
    resolve(process.cwd(), "apps/web/dist"),
    resolve(__dirname, "../../../../apps/web/dist"),
    resolve(__dirname, "../../web/dist"),
  ];
  const staticPath = candidates.find((p) => existsSync(p));

  if (staticPath) {
    app.useStaticAssets(staticPath);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get("*", (req: any, res: any, next: any) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(join(staticPath, "index.html"));
    });
  }

  const port = Number(process.env.PORT || 3001);
  await app.listen(port, "0.0.0.0");
  console.log(`PROMECAL ERP running on port ${port} (mode: ${staticPath ? "fullstack" : "api-only"})`);
}
void bootstrap();
