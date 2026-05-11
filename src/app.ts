import Fastify from "fastify";
import { empresasRoutes } from "./modules/empresas/empresas.routes.js";
import { recalculosRoutes } from "./modules/recalculos/recalculos.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.get("/health", async () => ({
    status: "ok"
  }));

  app.register(empresasRoutes);
  app.register(recalculosRoutes);

  return app;
}
