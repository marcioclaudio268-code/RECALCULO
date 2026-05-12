import Fastify from "fastify";
import cors from "@fastify/cors";
import { empresasRoutes } from "./modules/empresas/empresas.routes.js";
import { recalculosRoutes } from "./modules/recalculos/recalculos.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-user-id"]
  });

  app.get("/health", async () => ({
    status: "ok"
  }));

  app.register(empresasRoutes);
  app.register(recalculosRoutes);

  return app;
}
