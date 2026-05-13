/* trunk-ignore-all(prettier) */
import { compare } from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import { gerarTokenUsuario } from "../../lib/auth.js";
import { registrarLogin } from "../auditorias/auditorias.service.js";
import type { LoginBody } from "./auth.schemas.js";

const usuarioSeguroSelect = {
  id: true,
  nome: true,
  login: true,
  email: true,
  perfil: true
} as const;

export async function login(input: LoginBody) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      login: input.login
    },
    select: {
      id: true,
      nome: true,
      login: true,
      email: true,
      perfil: true,
      senhaHash: true,
      ativo: true
    }
  });

  if (!usuario) {
    throw new HttpError(401, "Login ou senha invalidos.");
  }

  if (!usuario.ativo) {
    throw new HttpError(403, "Usuario inativo.");
  }

  const senhaValida = await compare(input.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new HttpError(401, "Login ou senha invalidos.");
  }

  const usuarioSeguro = {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    email: usuario.email,
    perfil: usuario.perfil
  };

  const token = gerarTokenUsuario(usuarioSeguro);

  await prisma.$transaction(async (tx) => {
    await registrarLogin(tx, {
      usuarioId: usuario.id,
      login: usuario.login,
      email: usuario.email
    });
  });

  return {
    token,
    usuario: usuarioSeguro
  };
}

export async function buscarUsuarioSeguro(id: string) {
  return prisma.usuario.findFirst({
    where: {
      id,
      ativo: true
    },
    select: usuarioSeguroSelect
  });
}