import type { FastifyInstance } from "fastify";
import { handleRouteError, HttpError } from "../../lib/http-error.js";
import { gerarRelatorioRecalculosExcel } from "./relatorios.service.js";
import {
  relatorioRecalculosHeadersSchema,
  relatorioRecalculosQuerySchema
} from "./relatorios.schemas.js";

export async function relatoriosRoutes(app: FastifyInstance) {
  app.get("/relatorios/recalculos.xlsx", async (request, reply) => {
    try {
      const userIdHeader = request.headers["x-user-id"];

      if (typeof userIdHeader !== "string") {
        throw new HttpError(400, "Header x-user-id obrigatorio.");
      }

      const headers = relatorioRecalculosHeadersSchema.parse({
        "x-user-id": userIdHeader
      });
      const query = relatorioRecalculosQuerySchema.parse(request.query);
      const { buffer, filename } = await gerarRelatorioRecalculosExcel(
        headers["x-user-id"],
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
