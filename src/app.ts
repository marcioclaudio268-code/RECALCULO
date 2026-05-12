import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { empresasRoutes } from "./modules/empresas/empresas.routes.js";
import { recalculosRoutes } from "./modules/recalculos/recalculos.routes.js";
import { relatoriosRoutes } from "./modules/relatorios/relatorios.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"]
  });

  app.register(multipart);

  app.get("/health", async () => ({
    status: "ok"
  }));

  app.register(authRoutes);
  app.register(empresasRoutes);
  app.register(recalculosRoutes);
  app.register(relatoriosRoutes);

  return app;
}
