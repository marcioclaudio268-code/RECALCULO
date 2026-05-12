import type { FastifyInstance } from "fastify";
import { exigirAdmin } from "../../lib/auth.js";
import { handleRouteError } from "../../lib/http-error.js";
import {
  alterarSenhaUsuario,
  ativarUsuario,
  criarUsuario,
  desativarUsuario,
  editarUsuario,
  listarUsuarios
} from "./usuarios.service.js";
import {
  alterarSenhaUsuarioBodySchema,
  criarUsuarioBodySchema,
  editarUsuarioBodySchema,
  usuarioParamsSchema
} from "./usuarios.schemas.js";

export async function usuariosRoutes(app: FastifyInstance) {
  app.get("/usuarios", async (request, reply) => {
    try {
      await exigirAdmin(request);
      return await listarUsuarios();
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/usuarios", async (request, reply) => {
    try {
      const admin = await exigirAdmin(request);
      const body = criarUsuarioBodySchema.parse(request.body);
      const usuario = await criarUsuario(admin.id, body);
      return reply.code(201).send(usuario);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.patch("/usuarios/:id", async (request, reply) => {
    try {
      const admin = await exigirAdmin(request);
      const params = usuarioParamsSchema.parse(request.params);
      const body = editarUsuarioBodySchema.parse(request.body);
      return await editarUsuario(admin.id, params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/usuarios/:id/alterar-senha", async (request, reply) => {
    try {
      const admin = await exigirAdmin(request);
      const params = usuarioParamsSchema.parse(request.params);
      const body = alterarSenhaUsuarioBodySchema.parse(request.body);
      return await alterarSenhaUsuario(admin.id, params.id, body);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/usuarios/:id/ativar", async (request, reply) => {
    try {
      const admin = await exigirAdmin(request);
      const params = usuarioParamsSchema.parse(request.params);
      return await ativarUsuario(admin.id, params.id);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });

  app.post("/usuarios/:id/desativar", async (request, reply) => {
    try {
      const admin = await exigirAdmin(request);
      const params = usuarioParamsSchema.parse(request.params);
      return await desativarUsuario(admin.id, params.id);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
