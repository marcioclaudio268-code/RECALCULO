import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../lib/http-error.js";
import {
  criarRecalculo,
  detalharRecalculo,
  listarRecalculos
} from "./recalculos.service.js";
import {
  criarRecalculoBodySchema,
  criarRecalculoHeadersSchema,
  listarRecalculosQuerySchema,
  recalculoParamsSchema
} from "./recalculos.schemas.js";

export async function recalculosRoutes(app: FastifyInstance) {
  app.get("/recalculos", async (request, reply) => {
    try {
      const query = listarRecalculosQuerySchema.parse(request.query);
      return await listarRecalculos(query);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.get("/recalculos/:id", async (request, reply) => {
    try {
      const params = recalculoParamsSchema.parse(request.params);
      return await detalharRecalculo(params.id);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/recalculos", async (request, reply) => {
    try {
      const headers = criarRecalculoHeadersSchema.parse({
        "x-user-id": request.headers["x-user-id"]
      });
      const body = criarRecalculoBodySchema.parse(request.body);
      const resultado = await criarRecalculo(headers["x-user-id"], body);

      return reply.status(201).send(resultado);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
