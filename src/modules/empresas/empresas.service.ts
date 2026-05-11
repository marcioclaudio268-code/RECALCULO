import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { ListarEmpresasQuery } from "./empresas.schemas.js";

const empresaSelect = {
  id: true,
  codigoEmpresa: true,
  documento: true,
  tipoDocumento: true,
  nome: true,
  nomeFantasia: true,
  ativa: true
} satisfies Prisma.EmpresaSelect;

export async function listarEmpresas(query: ListarEmpresasQuery) {
  const where: Prisma.EmpresaWhereInput = {};

  if (query.ativa !== undefined) {
    where.ativa = query.ativa;
  }

  if (query.busca) {
    where.OR = [
      {
        codigoEmpresa: {
          contains: query.busca,
          mode: "insensitive"
        }
      },
      {
        documento: {
          contains: query.busca,
          mode: "insensitive"
        }
      },
      {
        nome: {
          contains: query.busca,
          mode: "insensitive"
        }
      },
      {
        nomeFantasia: {
          contains: query.busca,
          mode: "insensitive"
        }
      }
    ];
  }

  return prisma.empresa.findMany({
    where,
    select: empresaSelect,
    orderBy: {
      nome: "asc"
    },
    take: query.limit,
    skip: query.offset
  });
}

export async function detalharEmpresa(id: string) {
  const empresa = await prisma.empresa.findUnique({
    where: {
      id
    },
    select: {
      ...empresaSelect,
      createdAt: true,
      updatedAt: true,
      contatos: {
        where: {
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          email: true,
          cargo: true,
          departamento: true,
          ativo: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          nome: "asc"
        }
      },
      recalculos: {
        select: {
          id: true,
          tipoGuia: true,
          competencia: true,
          descricao: true,
          dataRecalculo: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          {
            dataRecalculo: "desc"
          },
          {
            createdAt: "desc"
          }
        ],
        take: 10
      }
    }
  });

  if (!empresa) {
    throw new HttpError(404, "Empresa nao encontrada.");
  }

  return empresa;
}
