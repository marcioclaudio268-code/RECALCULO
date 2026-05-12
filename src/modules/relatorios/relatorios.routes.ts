import type { FastifyInstance } from "fastify";
import { autenticarRequest } from "../../lib/auth.js";
import { handleRouteError } from "../../lib/http-error.js";
import { gerarRelatorioRecalculosExcel } from "./relatorios.service.js";
import { relatorioRecalculosQuerySchema } from "./relatorios.schemas.js";

export async function relatoriosRoutes(app: FastifyInstance) {
  app.get("/relatorios/recalculos.xlsx", async (request, reply) => {
    try {
      const usuario = await autenticarRequest(request);
      const query = relatorioRecalculosQuerySchema.parse(request.query);
      const { buffer, filename } = await gerarRelatorioRecalculosExcel(
        usuario.id,
        query
      );

      return reply
        .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", `attachment; filename="${filename}"`)
        .send(buffer);
    } catch (error) {
      return handleRouteError(error, reply, request.log);
    }
  });
}
