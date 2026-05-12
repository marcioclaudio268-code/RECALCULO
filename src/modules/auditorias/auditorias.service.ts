import {
  AcaoAuditoria,
  EntidadeAuditoria,
  type Prisma
} from "../../generated/prisma/client.js";

type AuditoriaClient = Pick<Prisma.TransactionClient, "auditoria">;

type RegistrarCriacaoRecalculoParams = {
  usuarioId: string;
  recalculoId: string;
  resumo: {
    empresaId: string;
    tipoGuia: string;
    competencia: string;
    descricao: string;
    dataRecalculo: Date;
    responsavelId: string;
    status: string;
  };
};

export async function registrarCriacaoRecalculo(
  client: AuditoriaClient,
  params: RegistrarCriacaoRecalculoParams
) {
  return client.auditoria.create({
    data: {
      usuarioId: params.usuarioId,
      entidade: EntidadeAuditoria.RECALCULO_GUIA,
      entidadeId: params.recalculoId,
      acao: AcaoAuditoria.CRIACAO,
      campoAlterado: null,
      valorAnterior: null,
      valorNovo: JSON.stringify({
        empresaId: params.resumo.empresaId,
        tipoGuia: params.resumo.tipoGuia,
        competencia: params.resumo.competencia,
        descricao: params.resumo.descricao,
        dataRecalculo: params.resumo.dataRecalculo.toISOString(),
        responsavelId: params.resumo.responsavelId,
        status: params.resumo.status
      })
    }
  });
}

type AlteracaoAuditoria = {
  campoAlterado: string;
  valorAnterior: string | null;
  valorNovo: string | null;
};

type RegistrarEdicaoRecalculoParams = {
  usuarioId: string;
  recalculoId: string;
  alteracoes: AlteracaoAuditoria[];
};

export async function registrarEdicaoRecalculo(
  client: AuditoriaClient,
  params: RegistrarEdicaoRecalculoParams
) {
  return Promise.all(
    params.alteracoes.map((alteracao) =>
      client.auditoria.create({
        data: {
          usuarioId: params.usuarioId,
          entidade: EntidadeAuditoria.RECALCULO_GUIA,
          entidadeId: params.recalculoId,
          acao: AcaoAuditoria.EDICAO,
          campoAlterado: alteracao.campoAlterado,
          valorAnterior: alteracao.valorAnterior,
          valorNovo: alteracao.valorNovo
        }
      })
    )
  );
}

type RegistrarCancelamentoRecalculoParams = {
  usuarioId: string;
  recalculoId: string;
  statusAnterior: string;
  motivoCancelamento: string;
};

export async function registrarCancelamentoRecalculo(
  client: AuditoriaClient,
  params: RegistrarCancelamentoRecalculoParams
) {
  return client.auditoria.create({
    data: {
      usuarioId: params.usuarioId,
      entidade: EntidadeAuditoria.RECALCULO_GUIA,
      entidadeId: params.recalculoId,
      acao: AcaoAuditoria.CANCELAMENTO,
      campoAlterado: "status",
      valorAnterior: params.statusAnterior,
      valorNovo: JSON.stringify({
        status: "CANCELADO",
        motivoCancelamento: params.motivoCancelamento
      })
    }
  });
}

type RegistrarImportacaoEmpresasParams = {
  usuarioId: string;
  importacaoId: string;
  resumo: {
    nomeArquivo: string;
    totalLinhas: number;
    empresasCriadas: number;
    empresasAtualizadas: number;
    contatosCriados: number;
    linhasIgnoradas: number;
    totalErros: number;
  };
};

export async function registrarImportacaoEmpresas(
  client: AuditoriaClient,
  params: RegistrarImportacaoEmpresasParams
) {
  return client.auditoria.create({
    data: {
      usuarioId: params.usuarioId,
      entidade: EntidadeAuditoria.IMPORTACAO_EMPRESAS,
      entidadeId: params.importacaoId,
      acao: AcaoAuditoria.IMPORTACAO,
      campoAlterado: null,
      valorAnterior: null,
      valorNovo: JSON.stringify(params.resumo)
    }
  });
}
