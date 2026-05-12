import type { FastifyRequest } from "fastify";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "./prisma.js";
import { HttpError } from "./http-error.js";

const usuarioAutenticadoSelect = {
  id: true,
  nome: true,
  email: true
} as const;

export type UsuarioAutenticado = {
  id: string;
  nome: string;
  email: string;
};

type JwtPayloadUsuario = {
  sub: string;
};

function obterJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET nao configurado.");
  }

  return "dev-local-recalculo-guias-altere-este-segredo";
}

function obterJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN?.trim() || "8h") as SignOptions["expiresIn"];
}

export function gerarTokenUsuario(usuario: UsuarioAutenticado) {
  return jwt.sign({}, obterJwtSecret(), {
    subject: usuario.id,
    expiresIn: obterJwtExpiresIn()
  });
}

export function verificarToken(token: string): JwtPayloadUsuario {
  try {
    const payload = jwt.verify(token, obterJwtSecret());

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string"
    ) {
      throw new HttpError(401, "Token invalido.");
    }

    return {
      sub: payload.sub
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "Token invalido ou expirado.");
  }
}

function extrairBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw new HttpError(401, "Authorization Bearer token obrigatorio.");
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());

  if (!match) {
    throw new HttpError(401, "Authorization deve usar o formato Bearer <token>.");
  }

  return match[1];
}

export async function autenticarRequest(request: FastifyRequest) {
  const token = extrairBearerToken(request);
  const payload = verificarToken(token);

  const usuario = await prisma.usuario.findFirst({
    where: {
      id: payload.sub,
      ativo: true
    },
    select: usuarioAutenticadoSelect
  });

  if (!usuario) {
    throw new HttpError(401, "Usuario autenticado nao encontrado ou inativo.");
  }

  return usuario;
}
