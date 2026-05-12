import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import {
  garantirArquivoEvidenciaExiste,
  removerArquivoEvidencia,
  resolverCaminhoEvidencia,
  salvarArquivoEvidencia
} from "../../lib/evidencias-storage.js";
import {
  EntidadeAuditoria,
  StatusRecalculo,
  type Prisma
} from "../../generated/prisma/client.js";
import {
  registrarAnexoEvidenciaRecalculo,
  registrarCancelamentoRecalculo,
  registrarCriacaoRecalculo,
  registrarEdicaoRecalculo
} from "../auditorias/auditorias.service.js";
import type {
  CancelarRecalculoBody,
  CriarRecalculoBody,
  EditarRecalculoBody,
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

const evidenciaDetalheSelect = {
  id: true,
  nomeArquivo: true,
  tipoArquivo: true,
  tamanhoArquivo: true,
  enviadoPorId: true,
  createdAt: true,
  enviadoPor: {
    select: usuarioResumoSelect
  }
} satisfies Prisma.EvidenciaSolicitacaoSelect;

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

const recalculoDetalheInclude = {
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
    select: evidenciaDetalheSelect,
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.RecalculoGuiaInclude;

type RecalculoAtual = Prisma.RecalculoGuiaGetPayload<object>;
type CampoEditavelRecalculo = keyof EditarRecalculoBody;

type AnexarEvidenciaInput = {
  nomeArquivo: string;
  tipoArquivo: string;
  buffer: Buffer;
};

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

function serializarValorAuditoria(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function normalizarValorComparacao(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return value;
}

function obterCamposAlterados(
  recalculoAtual: RecalculoAtual,
  input: EditarRecalculoBody
) {
  const campos = Object.keys(input) as CampoEditavelRecalculo[];

  return campos.flatMap((campo) => {
    const valorAnterior = recalculoAtual[campo];
    const valorNovo = input[campo];

    if (
      normalizarValorComparacao(valorAnterior) ===
      normalizarValorComparacao(valorNovo)
    ) {
      return [];
    }

    return [
      {
        campoAlterado: campo,
        valorAnterior: serializarValorAuditoria(valorAnterior),
        valorNovo: serializarValorAuditoria(valorNovo)
      }
    ];
  });
}

function montarDadosAtualizacao(
  input: EditarRecalculoBody,
  usuarioId: string
): Prisma.RecalculoGuiaUncheckedUpdateInput {
  const data: Prisma.RecalculoGuiaUncheckedUpdateInput = {
    atualizadoPorId: usuarioId
  };

  if (Object.hasOwn(input, "tipoGuia")) {
    data.tipoGuia = input.tipoGuia;
  }

  if (Object.hasOwn(input, "competencia")) {
    data.competencia = input.competencia;
  }

  if (Object.hasOwn(input, "descricao")) {
    data.descricao = input.descricao;
  }

  if (Object.hasOwn(input, "motivo")) {
    data.motivo = input.motivo;
  }

  if (Object.hasOwn(input, "solicitante")) {
    data.solicitante = input.solicitante;
  }

  if (Object.hasOwn(input, "dataSolicitacao")) {
    data.dataSolicitacao = input.dataSolicitacao;
  }

  if (Object.hasOwn(input, "dataRecalculo")) {
    data.dataRecalculo = input.dataRecalculo;
  }

  if (Object.hasOwn(input, "responsavelId")) {
    data.responsavelId = input.responsavelId;
  }

  if (Object.hasOwn(input, "observacoes")) {
    data.observacoes = input.observacoes;
  }

  return data;
}

async function buscarUsuarioAtivo(usuarioId: string) {
  return prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      ativo: true
    },
    select: usuarioResumoSelect
  });
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
    include: recalculoDetalheInclude
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

export async function editarRecalculo(
  usuarioId: string,
  id: string,
  input: EditarRecalculoBody
) {
  const [usuarioAtualizador, responsavel] = await Promise.all([
    buscarUsuarioAtivo(usuarioId),
    input.responsavelId
      ? prisma.usuario.findFirst({
          where: {
            id: input.responsavelId,
            ativo: true
          },
          select: usuarioResumoSelect
        })
      : Promise.resolve(null)
  ]);

  if (!usuarioAtualizador) {
    throw new HttpError(404, "Usuario autenticado nao encontrado ou inativo.");
  }

  if (input.responsavelId && !responsavel) {
    throw new HttpError(404, "Responsavel nao encontrado ou inativo.");
  }

  await prisma.$transaction(async (tx) => {
    const recalculoAtual = await tx.recalculoGuia.findUnique({
      where: {
        id
      }
    });

    if (!recalculoAtual) {
      throw new HttpError(404, "Recalculo nao encontrado.");
    }

    if (recalculoAtual.status === StatusRecalculo.CANCELADO) {
      throw new HttpError(409, "Recalculo cancelado nao pode ser editado.");
    }

    const alteracoes = obterCamposAlterados(recalculoAtual, input);

    if (alteracoes.length === 0) {
      throw new HttpError(400, "Nenhuma alteracao detectada.");
    }

    await tx.recalculoGuia.update({
      where: {
        id
      },
      data: montarDadosAtualizacao(input, usuarioId)
    });

    await registrarEdicaoRecalculo(tx, {
      usuarioId,
      recalculoId: id,
      alteracoes
    });
  });

  return detalharRecalculo(id);
}

export async function cancelarRecalculo(
  usuarioId: string,
  id: string,
  input: CancelarRecalculoBody
) {
  const usuarioCancelamento = await buscarUsuarioAtivo(usuarioId);

  if (!usuarioCancelamento) {
    throw new HttpError(404, "Usuario autenticado nao encontrado ou inativo.");
  }

  await prisma.$transaction(async (tx) => {
    const recalculoAtual = await tx.recalculoGuia.findUnique({
      where: {
        id
      }
    });

    if (!recalculoAtual) {
      throw new HttpError(404, "Recalculo nao encontrado.");
    }

    if (recalculoAtual.status === StatusRecalculo.CANCELADO) {
      throw new HttpError(409, "Recalculo ja esta cancelado.");
    }

    await tx.recalculoGuia.update({
      where: {
        id
      },
      data: {
        status: StatusRecalculo.CANCELADO,
        atualizadoPorId: usuarioId
      }
    });

    await registrarCancelamentoRecalculo(tx, {
      usuarioId,
      recalculoId: id,
      statusAnterior: recalculoAtual.status,
      motivoCancelamento: input.motivoCancelamento
    });
  });

  return detalharRecalculo(id);
}

export async function anexarEvidenciaRecalculo(
  usuarioId: string,
  recalculoId: string,
  input: AnexarEvidenciaInput
) {
  const [usuarioEnvio, recalculo] = await Promise.all([
    buscarUsuarioAtivo(usuarioId),
    prisma.recalculoGuia.findUnique({
      where: {
        id: recalculoId
      },
      select: {
        id: true,
        status: true
      }
    })
  ]);

  if (!usuarioEnvio) {
    throw new HttpError(404, "Usuario autenticado nao encontrado ou inativo.");
  }

  if (!recalculo) {
    throw new HttpError(404, "Recalculo nao encontrado.");
  }

  if (recalculo.status === StatusRecalculo.CANCELADO) {
    throw new HttpError(409, "Nao e permitido anexar evidencia em recalculo cancelado.");
  }

  const arquivoSalvo = await salvarArquivoEvidencia({
    recalculoId,
    nomeArquivo: input.nomeArquivo,
    tipoArquivo: input.tipoArquivo,
    buffer: input.buffer
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const evidencia = await tx.evidenciaSolicitacao.create({
        data: {
          recalculoId,
          nomeArquivo: input.nomeArquivo,
          caminhoArquivo: arquivoSalvo.caminhoRelativo,
          tipoArquivo: input.tipoArquivo,
          tamanhoArquivo: input.buffer.length,
          enviadoPorId: usuarioId
        },
        select: evidenciaDetalheSelect
      });

      await registrarAnexoEvidenciaRecalculo(tx, {
        usuarioId,
        recalculoId,
        evidencia: {
          id: evidencia.id,
          nomeArquivo: evidencia.nomeArquivo,
          tipoArquivo: evidencia.tipoArquivo,
          tamanhoArquivo: evidencia.tamanhoArquivo
        }
      });

      return evidencia;
    });
  } catch (error) {
    await removerArquivoEvidencia(arquivoSalvo.caminhoRelativo).catch(() => undefined);
    throw error;
  }
}

export async function obterArquivoEvidencia(usuarioId: string, evidenciaId: string) {
  const usuario = await buscarUsuarioAtivo(usuarioId);

  if (!usuario) {
    throw new HttpError(404, "Usuario autenticado nao encontrado ou inativo.");
  }

  const evidencia = await prisma.evidenciaSolicitacao.findUnique({
    where: {
      id: evidenciaId
    },
    select: {
      id: true,
      nomeArquivo: true,
      caminhoArquivo: true,
      tipoArquivo: true
    }
  });

  if (!evidencia) {
    throw new HttpError(404, "Evidencia nao encontrada.");
  }

  const caminhoAbsoluto = resolverCaminhoEvidencia(evidencia.caminhoArquivo);
  await garantirArquivoEvidenciaExiste(caminhoAbsoluto);

  return {
    evidencia,
    caminhoAbsoluto
  };
}

export async function criarRecalculo(usuarioId: string, input: CriarRecalculoBody) {
  const responsavelId = input.responsavelId ?? usuarioId;
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
        id: responsavelId,
        ativo: true
      },
      select: usuarioResumoSelect
    })
  ]);

  if (!usuarioCriador) {
    throw new HttpError(404, "Usuario autenticado nao encontrado ou inativo.");
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
        responsavelId,
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
