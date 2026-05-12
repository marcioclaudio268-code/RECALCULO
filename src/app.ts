import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { empresasRoutes } from "./modules/empresas/empresas.routes.js";
import { recalculosRoutes } from "./modules/recalculos/recalculos.routes.js";
import { relatoriosRoutes } from "./modules/relatorios/relatorios.routes.js";
import { usuariosRoutes } from "./modules/usuarios/usuarios.routes.js";

export function buildApp() {
  const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: frontendOrigins,
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
  app.register(usuariosRoutes);

  return app;
}
