import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../lib/http-error.js";
import {
  detalharEmpresa,
  listarEmpresas
} from "./empresas.service.js";
import {
  empresaParamsSchema,
  listarEmpresasQuerySchema
} from "./empresas.schemas.js";

export async function empresasRoutes(app: FastifyInstance) {
  app.get("/empresas", async (request, reply) => {
    try {
      const query = listarEmpresasQuerySchema.parse(request.query);
      return await listarEmpresas(query);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.get("/empresas/:id", async (request, reply) => {
    try {
      const params = empresaParamsSchema.parse(request.params);
      return await detalharEmpresa(params.id);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
