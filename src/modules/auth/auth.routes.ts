import type { FastifyInstance } from "fastify";
import { autenticarRequest } from "../../lib/auth.js";
import { handleRouteError } from "../../lib/http-error.js";
import { loginBodySchema } from "./auth.schemas.js";
import { login } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body);
      return await login(body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.get("/auth/me", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      return {
        usuario
      };
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    try {
      await autenticarRequest(request);
      return {
        ok: true
      };
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
