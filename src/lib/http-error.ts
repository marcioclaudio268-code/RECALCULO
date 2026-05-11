import type { FastifyBaseLogger, FastifyReply } from "fastify";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function handleRouteError(
  error: unknown,
  reply: FastifyReply,
  logger?: FastifyBaseLogger
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      erro: "Entrada invalida.",
      detalhes: error.issues.map((issue) => ({
        campo: issue.path.join("."),
        mensagem: issue.message
      }))
    });
  }

  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      erro: error.message
    });
  }

  logger?.error(error);

  return reply.status(500).send({
    erro: "Erro inesperado."
  });
}
