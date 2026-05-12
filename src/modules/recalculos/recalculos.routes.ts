import { createReadStream } from "node:fs";
import type { FastifyInstance } from "fastify";
import { autenticarRequest } from "../../lib/auth.js";
import { MAX_EVIDENCIA_BYTES } from "../../lib/evidencias-storage.js";
import { handleRouteError, HttpError } from "../../lib/http-error.js";
import {
  anexarEvidenciaRecalculo,
  cancelarRecalculo,
  criarRecalculo,
  detalharRecalculo,
  editarRecalculo,
  listarRecalculos,
  obterArquivoEvidencia
} from "./recalculos.service.js";
import {
  cancelarRecalculoBodySchema,
  criarRecalculoBodySchema,
  editarRecalculoBodySchema,
  evidenciaParamsSchema,
  listarRecalculosQuerySchema,
  recalculoParamsSchema
} from "./recalculos.schemas.js";

export async function recalculosRoutes(app: FastifyInstance) {
  app.get("/recalculos", async (request, reply) => {
    try {
      await autenticarRequest(request);
      const query = listarRecalculosQuerySchema.parse(request.query);
      return await listarRecalculos(query);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.get("/recalculos/:id", async (request, reply) => {
    try {
      await autenticarRequest(request);
      const params = recalculoParamsSchema.parse(request.params);
      return await detalharRecalculo(params.id);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/recalculos", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const body = criarRecalculoBodySchema.parse(request.body);
      const resultado = await criarRecalculo(usuario.id, body);

      return reply.status(201).send(resultado);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.patch("/recalculos/:id", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const params = recalculoParamsSchema.parse(request.params);
      const body = editarRecalculoBodySchema.parse(request.body);

      return await editarRecalculo(usuario.id, params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/recalculos/:id/cancelar", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const params = recalculoParamsSchema.parse(request.params);
      const body = cancelarRecalculoBodySchema.parse(request.body);

      return await cancelarRecalculo(usuario.id, params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/recalculos/:id/evidencias", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const params = recalculoParamsSchema.parse(request.params);

      const file = await request.file({
        limits: {
          fileSize: MAX_EVIDENCIA_BYTES,
          files: 1
        }
      });

      if (!file) {
        throw new HttpError(400, "Envie um arquivo de evidencia.");
      }

      if (file.fieldname !== "arquivo") {
        throw new HttpError(400, "Envie o arquivo no campo multipart 'arquivo'.");
      }

      let buffer: Buffer;

      try {
        buffer = await file.toBuffer();
      } catch {
        throw new HttpError(400, "Arquivo excede o limite de 5 MB.");
      }

      const evidencia = await anexarEvidenciaRecalculo(
        usuario.id,
        params.id,
        {
          nomeArquivo: file.filename,
          tipoArquivo: file.mimetype.toLowerCase(),
          buffer
        }
      );

      return reply.status(201).send(evidencia);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.get("/evidencias/:id/arquivo", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const params = evidenciaParamsSchema.parse(request.params);
      const { evidencia, caminhoAbsoluto } = await obterArquivoEvidencia(
        usuario.id,
        params.id
      );
      const nomeArquivoSeguro = evidencia.nomeArquivo.replace(/["\r\n]/g, "_");

      return reply
        .type(evidencia.tipoArquivo)
        .header("Content-Disposition", `inline; filename="${nomeArquivoSeguro}"`)
        .send(createReadStream(caminhoAbsoluto));
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
