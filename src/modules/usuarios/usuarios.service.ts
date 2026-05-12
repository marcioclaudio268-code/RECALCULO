import { hash } from "bcryptjs";
import { PerfilUsuario, type Prisma } from "../../generated/prisma/client.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../lib/prisma.js";
import {
  registrarCriacaoUsuario,
  registrarEdicaoUsuario
} from "../auditorias/auditorias.service.js";
import type {
  AlterarSenhaUsuarioBody,
  CriarUsuarioBody,
  EditarUsuarioBody
} from "./usuarios.schemas.js";

const usuarioSeguroSelect = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UsuarioSelect;

type UsuarioAtual = Prisma.UsuarioGetPayload<{
  select: typeof usuarioSeguroSelect;
}>;

function serializarValor(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function montarAlteracoes(usuarioAtual: UsuarioAtual, input: EditarUsuarioBody) {
  const alteracoes: Array<{
    campoAlterado: string;
    valorAnterior: string | null;
    valorNovo: string | null;
  }> = [];

  for (const campo of ["nome", "email", "perfil", "ativo"] as const) {
    if (Object.hasOwn(input, campo) && usuarioAtual[campo] !== input[campo]) {
      alteracoes.push({
        campoAlterado: campo,
        valorAnterior: serializarValor(usuarioAtual[campo]),
        valorNovo: serializarValor(input[campo])
      });
    }
  }

  return alteracoes;
}

async function buscarUsuarioObrigatorio(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id
    },
    select: usuarioSeguroSelect
  });

  if (!usuario) {
    throw new HttpError(404, "Usuario nao encontrado.");
  }

  return usuario;
}

async function garantirEmailDisponivel(email: string, ignorarUsuarioId?: string) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  });

  if (usuario && usuario.id !== ignorarUsuarioId) {
    throw new HttpError(409, "Ja existe usuario com este e-mail.");
  }
}

export async function listarUsuarios() {
  return prisma.usuario.findMany({
    select: usuarioSeguroSelect,
    orderBy: {
      nome: "asc"
    }
  });
}

export async function criarUsuario(adminId: string, input: CriarUsuarioBody) {
  await garantirEmailDisponivel(input.email);

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome: input.nome,
        email: input.email,
        senhaHash: await hash(input.senha, 10),
        perfil: input.perfil,
        ativo: input.ativo ?? true
      },
      select: usuarioSeguroSelect
    });

    await registrarCriacaoUsuario(tx, {
      usuarioId: adminId,
      usuarioCriadoId: usuario.id,
      resumo: {
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo
      }
    });

    return usuario;
  });
}

export async function editarUsuario(
  adminId: string,
  usuarioId: string,
  input: EditarUsuarioBody
) {
  const usuarioAtual = await buscarUsuarioObrigatorio(usuarioId);

  if (input.email) {
    await garantirEmailDisponivel(input.email, usuarioId);
  }

  if (usuarioId === adminId && input.ativo === false) {
    throw new HttpError(400, "Administrador nao pode desativar a propria conta.");
  }

  const alteracoes = montarAlteracoes(usuarioAtual, input);

  if (alteracoes.length === 0) {
    throw new HttpError(400, "Nenhuma alteracao detectada.");
  }

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.update({
      where: {
        id: usuarioId
      },
      data: {
        ...(Object.hasOwn(input, "nome") ? { nome: input.nome } : {}),
        ...(Object.hasOwn(input, "email") ? { email: input.email } : {}),
        ...(Object.hasOwn(input, "perfil") ? { perfil: input.perfil } : {}),
        ...(Object.hasOwn(input, "ativo") ? { ativo: input.ativo } : {})
      },
      select: usuarioSeguroSelect
    });

    await registrarEdicaoUsuario(tx, {
      usuarioId: adminId,
      usuarioEditadoId: usuario.id,
      alteracoes
    });

    return usuario;
  });
}

export async function alterarSenhaUsuario(
  adminId: string,
  usuarioId: string,
  input: AlterarSenhaUsuarioBody
) {
  await buscarUsuarioObrigatorio(usuarioId);

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.update({
      where: {
        id: usuarioId
      },
      data: {
        senhaHash: await hash(input.senha, 10)
      },
      select: usuarioSeguroSelect
    });

    await registrarEdicaoUsuario(tx, {
      usuarioId: adminId,
      usuarioEditadoId: usuario.id,
      alteracoes: [
        {
          campoAlterado: "senha",
          valorAnterior: null,
          valorNovo: "senha alterada"
        }
      ]
    });

    return usuario;
  });
}

export async function ativarUsuario(adminId: string, usuarioId: string) {
  return editarUsuario(adminId, usuarioId, {
    ativo: true
  });
}

export async function desativarUsuario(adminId: string, usuarioId: string) {
  if (adminId === usuarioId) {
    throw new HttpError(400, "Administrador nao pode desativar a propria conta.");
  }

  return editarUsuario(adminId, usuarioId, {
    ativo: false
  });
}

export { PerfilUsuario };
