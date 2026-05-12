import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import {
  EntidadeAuditoria,
  StatusRecalculo,
  type Prisma
} from "../../generated/prisma/client.js";
import { registrarCriacaoRecalculo } from "../auditorias/auditorias.service.js";
import type {
  CriarRecalculoBody,
  ListarRecalculosQuery
} from "./recalculos.schemas.js";

const empresaResumoSelect = {
  id: true,
  codigoEmpresa: true,
  documento: true,
  nome: true,
  nomeFantasia: true
} satisfies Prisma.EmpresaSelect;

const usuarioResumoSelect = {
  id: true,
  nome: true,
  email: true
} satisfies Prisma.UsuarioSelect;

function mapRecalculoListagem(
  recalculo: Prisma.RecalculoGuiaGetPayload<{
    select: typeof recalculoListagemSelect;
  }>
) {
  const quantidadeEvidencias = recalculo._count.evidencias;

  return {
    id: recalculo.id,
    empresa: recalculo.empresa,
    tipoGuia: recalculo.tipoGuia,
    competencia: recalculo.competencia,
    descricao: recalculo.descricao,
    dataRecalculo: recalculo.dataRecalculo,
    responsavel: recalculo.responsavel,
    status: recalculo.status,
    temEvidencia: quantidadeEvidencias > 0,
    quantidadeEvidencias,
    createdAt: recalculo.createdAt,
    updatedAt: recalculo.updatedAt
  };
}

const recalculoListagemSelect = {
  id: true,
  tipoGuia: true,
  competencia: true,
  descricao: true,
  dataRecalculo: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  empresa: {
    select: empresaResumoSelect
  },
  responsavel: {
    select: usuarioResumoSelect
  },
  _count: {
    select: {
      evidencias: true
    }
  }
} satisfies Prisma.RecalculoGuiaSelect;

function converterDataFiltro(value: string, fimDoDia = false) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (fimDoDia) {
      date.setHours(23, 59, 59, 999);
    }

    return date;
  }

  return new Date(value);
}

export async function listarRecalculos(query: ListarRecalculosQuery) {
  const where: Prisma.RecalculoGuiaWhereInput = {};

  if (query.empresaId) {
    where.empresaId = query.empresaId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.tipoGuia) {
    where.tipoGuia = query.tipoGuia;
  }

  if (query.competencia) {
    where.competencia = query.competencia;
  }

  if (query.responsavelId) {
    where.responsavelId = query.responsavelId;
  }

  if (query.dataInicio || query.dataFim) {
    where.dataRecalculo = {
      ...(query.dataInicio ? { gte: converterDataFiltro(query.dataInicio) } : {}),
      ...(query.dataFim ? { lte: converterDataFiltro(query.dataFim, true) } : {})
    };
  }

  const recalculos = await prisma.recalculoGuia.findMany({
    where,
    select: recalculoListagemSelect,
    orderBy: [
      {
        dataRecalculo: "desc"
      },
      {
        createdAt: "desc"
      }
    ],
    take: query.limit,
    skip: query.offset
  });

  return recalculos.map(mapRecalculoListagem);
}

export async function detalharRecalculo(id: string) {
  const recalculo = await prisma.recalculoGuia.findUnique({
    where: {
      id
    },
    include: {
      empresa: {
        select: empresaResumoSelect
      },
      responsavel: {
        select: usuarioResumoSelect
      },
      criadoPor: {
        select: usuarioResumoSelect
      },
      atualizadoPor: {
        select: usuarioResumoSelect
      },
      evidencias: {
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!recalculo) {
    throw new HttpError(404, "Recalculo nao encontrado.");
  }

  const auditorias = await prisma.auditoria.findMany({
    where: {
      entidade: EntidadeAuditoria.RECALCULO_GUIA,
      entidadeId: recalculo.id
    },
    include: {
      usuario: {
        select: usuarioResumoSelect
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return {
    ...recalculo,
    auditorias
  };
}

export async function criarRecalculo(usuarioId: string, input: CriarRecalculoBody) {
  const [usuarioCriador, empresa, responsavel] = await Promise.all([
    prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        ativo: true
      },
      select: usuarioResumoSelect
    }),
    prisma.empresa.findFirst({
      where: {
        id: input.empresaId,
        ativa: true
      },
      select: empresaResumoSelect
    }),
    prisma.usuario.findFirst({
      where: {
        id: input.responsavelId,
        ativo: true
      },
      select: usuarioResumoSelect
    })
  ]);

  if (!usuarioCriador) {
    throw new HttpError(404, "Usuario do header x-user-id nao encontrado ou inativo.");
  }

  if (!empresa) {
    throw new HttpError(404, "Empresa nao encontrada ou inativa.");
  }

  if (!responsavel) {
    throw new HttpError(404, "Responsavel nao encontrado ou inativo.");
  }

  const recalculosSimilares = await prisma.recalculoGuia.findMany({
    where: {
      empresaId: input.empresaId,
      tipoGuia: input.tipoGuia,
      competencia: input.competencia,
      descricao: input.descricao,
      status: {
        not: StatusRecalculo.CANCELADO
      }
    },
    select: {
      id: true,
      tipoGuia: true,
      competencia: true,
      descricao: true,
      dataRecalculo: true,
      status: true,
      createdAt: true
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
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const recalculo = await tx.recalculoGuia.create({
      data: {
        empresaId: input.empresaId,
        tipoGuia: input.tipoGuia,
        competencia: input.competencia,
        descricao: input.descricao,
        motivo: input.motivo ?? null,
        solicitante: input.solicitante ?? null,
        dataSolicitacao: input.dataSolicitacao ?? null,
        dataRecalculo: input.dataRecalculo,
        responsavelId: input.responsavelId,
        status: StatusRecalculo.LANCADO,
        observacoes: input.observacoes ?? null,
        criadoPorId: usuarioId,
        atualizadoPorId: usuarioId
      },
      include: {
        empresa: {
          select: empresaResumoSelect
        },
        responsavel: {
          select: usuarioResumoSelect
        },
        criadoPor: {
          select: usuarioResumoSelect
        },
        atualizadoPor: {
          select: usuarioResumoSelect
        },
        _count: {
          select: {
            evidencias: true
          }
        }
      }
    });

    const auditoria = await registrarCriacaoRecalculo(tx, {
      usuarioId,
      recalculoId: recalculo.id,
      resumo: {
        empresaId: recalculo.empresaId,
        tipoGuia: recalculo.tipoGuia,
        competencia: recalculo.competencia,
        descricao: recalculo.descricao,
        dataRecalculo: recalculo.dataRecalculo,
        responsavelId: recalculo.responsavelId,
        status: recalculo.status
      }
    });

    return {
      recalculo,
      auditoria
    };
  });

  const { _count, ...recalculo } = resultado.recalculo;

  return {
    recalculo: {
      ...recalculo,
      temEvidencia: _count.evidencias > 0,
      quantidadeEvidencias: _count.evidencias
    },
    auditoria: resultado.auditoria,
    alertaDuplicidade: recalculosSimilares.length > 0,
    recalculosSimilares
  };
}
