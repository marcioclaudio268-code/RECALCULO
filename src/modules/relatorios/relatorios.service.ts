import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import { StatusRecalculo, type Prisma } from "../../generated/prisma/client.js";
import type { RelatorioRecalculosQuery } from "./relatorios.schemas.js";

const MAX_DIAS_RELATORIO = 370;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

const usuarioRelatorioSelect = {
  id: true,
  nome: true,
  email: true
} satisfies Prisma.UsuarioSelect;

const recalculoRelatorioSelect = {
  id: true,
  tipoGuia: true,
  competencia: true,
  descricao: true,
  motivo: true,
  solicitante: true,
  dataSolicitacao: true,
  dataRecalculo: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  empresa: {
    select: {
      codigoEmpresa: true,
      nome: true,
      documento: true,
      tipoDocumento: true
    }
  },
  responsavel: {
    select: usuarioRelatorioSelect
  },
  criadoPor: {
    select: usuarioRelatorioSelect
  },
  atualizadoPor: {
    select: usuarioRelatorioSelect
  },
  _count: {
    select: {
      evidencias: true
    }
  }
} satisfies Prisma.RecalculoGuiaSelect;

type RecalculoRelatorio = Prisma.RecalculoGuiaGetPayload<{
  select: typeof recalculoRelatorioSelect;
}>;

type PeriodoRelatorio = {
  inicio: Date;
  fim: Date;
};

function parseDateOnly(value: string, fimDoDia = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new HttpError(400, "Data deve usar o formato YYYY-MM-DD.");
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new HttpError(400, "Informe datas validas para o relatorio.");
  }

  if (fimDoDia) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function montarPeriodo(query: RelatorioRecalculosQuery): PeriodoRelatorio {
  const inicio = parseDateOnly(query.dataInicio);
  const fim = parseDateOnly(query.dataFim, true);

  if (inicio.getTime() > fim.getTime()) {
    throw new HttpError(400, "Data inicial nao pode ser maior que a data final.");
  }

  const dias = Math.floor((fim.getTime() - inicio.getTime()) / MS_POR_DIA) + 1;

  if (dias > MAX_DIAS_RELATORIO) {
    throw new HttpError(400, "Periodo maximo permitido para o relatorio e de 370 dias.");
  }

  return {
    inicio,
    fim
  };
}

function formatarDataBrasil(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo"
  }).format(date);
}

function formatarUsuario(usuario: { nome: string; email?: string | null } | null) {
  if (!usuario) {
    return "";
  }

  return usuario.email ? `${usuario.nome} (${usuario.email})` : usuario.nome;
}

function formatarDocumento(documento: string) {
  const digits = documento.replace(/\D/g, "");

  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }

  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  return documento;
}

function montarLinhaRelatorio(recalculo: RecalculoRelatorio) {
  const quantidadeEvidencias = recalculo._count.evidencias;

  return [
    recalculo.empresa.codigoEmpresa,
    recalculo.empresa.nome,
    formatarDocumento(recalculo.empresa.documento),
    recalculo.empresa.tipoDocumento,
    recalculo.tipoGuia,
    recalculo.competencia,
    recalculo.descricao,
    recalculo.motivo ?? "",
    recalculo.solicitante ?? "",
    recalculo.dataSolicitacao,
    recalculo.dataRecalculo,
    formatarUsuario(recalculo.responsavel),
    recalculo.status,
    quantidadeEvidencias > 0 ? "Sim" : "Nao",
    quantidadeEvidencias,
    formatarUsuario(recalculo.criadoPor),
    recalculo.createdAt,
    formatarUsuario(recalculo.atualizadoPor),
    recalculo.updatedAt,
    recalculo.id
  ];
}

function aplicarEstiloCabecalho(row: ExcelJS.Row) {
  row.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF1D5F74"
    }
  };
  row.alignment = {
    vertical: "middle"
  };
}

async function buscarUsuarioAtivo(usuarioId: string) {
  return prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      ativo: true
    },
    select: usuarioRelatorioSelect
  });
}

async function buscarRecalculosRelatorio(
  periodo: PeriodoRelatorio,
  incluirCancelados: boolean
) {
  return prisma.recalculoGuia.findMany({
    where: {
      dataRecalculo: {
        gte: periodo.inicio,
        lte: periodo.fim
      },
      ...(incluirCancelados
        ? {}
        : {
            status: {
              not: StatusRecalculo.CANCELADO
            }
          })
    },
    select: recalculoRelatorioSelect,
    orderBy: [
      {
        dataRecalculo: "asc"
      },
      {
        createdAt: "asc"
      }
    ]
  });
}

function montarWorkbook(
  query: RelatorioRecalculosQuery,
  periodo: PeriodoRelatorio,
  recalculos: RecalculoRelatorio[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Automacao de Recalculo de Guias";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Recalculos", {
    views: [
      {
        state: "frozen",
        ySplit: 4
      }
    ]
  });

  worksheet.mergeCells("A1:T1");
  worksheet.getCell("A1").value = "Relat\u00f3rio de Rec\u00e1lculos";
  worksheet.getCell("A1").font = {
    bold: true,
    size: 16
  };

  worksheet.mergeCells("A2:T2");
  worksheet.getCell("A2").value =
    `Per\u00edodo: ${formatarDataBrasil(periodo.inicio)} a ${formatarDataBrasil(periodo.fim)}`;

  worksheet.mergeCells("A3:T3");
  worksheet.getCell("A3").value = query.incluirCancelados
    ? "Filtro: incluindo rec\u00e1lculos cancelados"
    : "Filtro: excluindo rec\u00e1lculos cancelados";

  worksheet.columns = [
    { key: "codigoEmpresa", width: 18 },
    { key: "empresa", width: 36 },
    { key: "documento", width: 20 },
    { key: "tipoDocumento", width: 16 },
    { key: "tipoGuia", width: 16 },
    { key: "competencia", width: 16 },
    { key: "descricao", width: 42 },
    { key: "motivo", width: 36 },
    { key: "solicitante", width: 24 },
    { key: "dataSolicitacao", width: 18 },
    { key: "dataRecalculo", width: 18 },
    { key: "responsavel", width: 30 },
    { key: "status", width: 16 },
    { key: "possuiEvidencia", width: 18 },
    { key: "quantidadeEvidencias", width: 24 },
    { key: "criadoPor", width: 30 },
    { key: "criadoEm", width: 20 },
    { key: "atualizadoPor", width: 30 },
    { key: "atualizadoEm", width: 20 },
    { key: "id", width: 38 }
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    "C\u00f3digo da empresa",
    "Empresa",
    "Documento",
    "Tipo documento",
    "Tipo guia",
    "Compet\u00eancia",
    "Descri\u00e7\u00e3o",
    "Motivo",
    "Solicitante",
    "Data solicita\u00e7\u00e3o",
    "Data rec\u00e1lculo",
    "Respons\u00e1vel",
    "Status",
    "Possui evid\u00eancia",
    "Quantidade de evid\u00eancias",
    "Criado por",
    "Criado em",
    "Atualizado por",
    "Atualizado em",
    "ID do rec\u00e1lculo"
  ];
  aplicarEstiloCabecalho(headerRow);

  recalculos.forEach((recalculo) => {
    worksheet.addRow(montarLinhaRelatorio(recalculo));
  });

  worksheet.autoFilter = {
    from: "A4",
    to: "T4"
  };

  [10, 11, 17, 19].forEach((columnNumber) => {
    worksheet.getColumn(columnNumber).numFmt = "dd/mm/yyyy";
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: "top",
        wrapText: true
      };
    });
  });

  return workbook;
}

export async function gerarRelatorioRecalculosExcel(
  usuarioId: string,
  query: RelatorioRecalculosQuery
) {
  const usuario = await buscarUsuarioAtivo(usuarioId);

  if (!usuario) {
    throw new HttpError(404, "Usuario do header x-user-id nao encontrado ou inativo.");
  }

  const periodo = montarPeriodo(query);
  const recalculos = await buscarRecalculosRelatorio(
    periodo,
    query.incluirCancelados
  );
  const workbook = montarWorkbook(query, periodo, recalculos);
  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    filename: `relatorio-recalculos-${query.dataInicio}-a-${query.dataFim}.xlsx`
  };
}
