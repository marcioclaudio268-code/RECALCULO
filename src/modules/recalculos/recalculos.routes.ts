import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../lib/http-error.js";
import {
  cancelarRecalculo,
  criarRecalculo,
  detalharRecalculo,
  editarRecalculo,
  listarRecalculos
} from "./recalculos.service.js";
import {
  cancelarRecalculoBodySchema,
  criarRecalculoBodySchema,
  criarRecalculoHeadersSchema,
  editarRecalculoBodySchema,
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

  app.patch("/recalculos/:id", async (request, reply) => {
    try {
      const params = recalculoParamsSchema.parse(request.params);
      const headers = criarRecalculoHeadersSchema.parse({
        "x-user-id": request.headers["x-user-id"]
      });
      const body = editarRecalculoBodySchema.parse(request.body);

      return await editarRecalculo(headers["x-user-id"], params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/recalculos/:id/cancelar", async (request, reply) => {
    try {
      const params = recalculoParamsSchema.parse(request.params);
      const headers = criarRecalculoHeadersSchema.parse({
        "x-user-id": request.headers["x-user-id"]
      });
      const body = cancelarRecalculoBodySchema.parse(request.body);

      return await cancelarRecalculo(headers["x-user-id"], params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
