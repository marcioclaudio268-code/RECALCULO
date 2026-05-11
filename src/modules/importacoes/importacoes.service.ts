import { basename } from "node:path";
import { prisma } from "../../lib/prisma.js";
import { parseSemicolonCsvFile, type CsvRow } from "../../lib/csv.js";
import {
  identificarTipoDocumento,
  normalizarDocumento,
  type TipoDocumentoImportado
} from "../../lib/documento.js";
import {
  TipoDocumento,
  type Prisma
} from "../../generated/prisma/client.js";
import { registrarImportacaoEmpresas } from "../auditorias/auditorias.service.js";

const COLUNAS_OBRIGATORIAS = [
  "ID",
  "CNPJ",
  "Razão social",
  "Nome fantasia",
  "Nome do Contato",
  "Telefone do Contato",
  "Email do Contato",
  "Cargo do Contato",
  "Departamentos do Contato"
] as const;

type ImportacaoErro = {
  linha?: number;
  codigoEmpresa?: string;
  documento?: string;
  tipo: string;
  mensagem: string;
};

type EmpresaCsv = {
  codigoEmpresa: string;
  documento: string;
  tipoDocumento: TipoDocumentoImportado;
  nome: string;
  nomeFantasia: string | null;
  linhasOrigem: number[];
};

type ContatoCsv = {
  codigoEmpresa: string;
  documento: string;
  linha: number;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  cargo: string | null;
  departamento: string | null;
};

type DadosPreparados = {
  totalLinhas: number;
  empresas: EmpresaCsv[];
  contatos: ContatoCsv[];
  linhasIgnoradas: number;
  erros: ImportacaoErro[];
};

export type ImportarEmpresasCsvParams = {
  caminhoArquivo: string;
  preview: boolean;
  usuarioId?: string;
};

export type ImportarEmpresasCsvResultado = {
  preview: boolean;
  nomeArquivo: string;
  usuarioId?: string;
  importacaoId?: string;
  auditoriaId?: string;
  totalLinhas: number;
  empresasValidas: number;
  contatosValidos: number;
  empresasCriadas: number;
  empresasAtualizadas: number;
  contatosCriados: number;
  linhasIgnoradas: number;
  erros: ImportacaoErro[];
};

export async function importarEmpresasCsv(
  params: ImportarEmpresasCsvParams
): Promise<ImportarEmpresasCsvResultado> {
  const nomeArquivo = basename(params.caminhoArquivo);
  const dados = await prepararDadosCsv(params.caminhoArquivo);

  if (params.preview) {
    return {
      preview: true,
      nomeArquivo,
      totalLinhas: dados.totalLinhas,
      empresasValidas: dados.empresas.length,
      contatosValidos: dados.contatos.length,
      empresasCriadas: 0,
      empresasAtualizadas: 0,
      contatosCriados: 0,
      linhasIgnoradas: dados.linhasIgnoradas,
      erros: dados.erros
    };
  }

  const usuario = await resolverUsuarioImportacao(params.usuarioId);
  const resultado = await gravarImportacao(nomeArquivo, usuario.id, dados);

  return {
    preview: false,
    nomeArquivo,
    usuarioId: usuario.id,
    ...resultado
  };
}

async function prepararDadosCsv(caminhoArquivo: string): Promise<DadosPreparados> {
  const csv = await parseSemicolonCsvFile(caminhoArquivo);
  validarEstruturaCsv(csv.headers);

  const empresasPorCodigo = new Map<string, EmpresaCsv>();
  const contatosPorChave = new Map<string, ContatoCsv>();
  const documentosPorCodigo = new Map<string, string>();
  const codigosPorDocumento = new Map<string, string>();
  const erros: ImportacaoErro[] = [];
  let totalLinhas = 0;
  let linhasIgnoradas = 0;

  for (const row of csv.rows) {
    if (isLinhaFiltro(row)) {
      continue;
    }

    totalLinhas += 1;

    const codigoEmpresa = campo(row, "ID");
    const documento = normalizarDocumento(campo(row, "CNPJ"));
    const nome = campo(row, "Razão social");

    if (!codigoEmpresa || !documento) {
      linhasIgnoradas += 1;
      erros.push({
        linha: row.lineNumber,
        codigoEmpresa,
        documento,
        tipo: "linha_sem_codigo_ou_documento",
        mensagem: "Linha ignorada por falta de codigo da empresa ou documento."
      });
      continue;
    }

    if (!nome) {
      linhasIgnoradas += 1;
      erros.push({
        linha: row.lineNumber,
        codigoEmpresa,
        documento,
        tipo: "linha_sem_razao_social",
        mensagem: "Linha ignorada por falta de razao social."
      });
      continue;
    }

    const tipoDocumento = identificarTipoDocumento(documento);

    if (!tipoDocumento) {
      linhasIgnoradas += 1;
      erros.push({
        linha: row.lineNumber,
        codigoEmpresa,
        documento,
        tipo: "documento_invalido",
        mensagem: "Documento informado nao e um CPF ou CNPJ valido."
      });
      continue;
    }

    const documentoJaAssociado = documentosPorCodigo.get(codigoEmpresa);
    const codigoJaAssociado = codigosPorDocumento.get(documento);

    if (documentoJaAssociado && documentoJaAssociado !== documento) {
      linhasIgnoradas += 1;
      erros.push({
        linha: row.lineNumber,
        codigoEmpresa,
        documento,
        tipo: "conflito_codigo_documento_no_csv",
        mensagem: `Codigo ${codigoEmpresa} aparece no CSV com documentos diferentes.`
      });
      continue;
    }

    if (codigoJaAssociado && codigoJaAssociado !== codigoEmpresa) {
      linhasIgnoradas += 1;
      erros.push({
        linha: row.lineNumber,
        codigoEmpresa,
        documento,
        tipo: "conflito_documento_codigo_no_csv",
        mensagem: `Documento ${documento} aparece no CSV com codigos diferentes.`
      });
      continue;
    }

    documentosPorCodigo.set(codigoEmpresa, documento);
    codigosPorDocumento.set(documento, codigoEmpresa);

    const empresaExistente = empresasPorCodigo.get(codigoEmpresa);
    const empresa = {
      codigoEmpresa,
      documento,
      tipoDocumento,
      nome,
      nomeFantasia: campoOpcional(row, "Nome fantasia"),
      linhasOrigem: empresaExistente
        ? [...empresaExistente.linhasOrigem, row.lineNumber]
        : [row.lineNumber]
    };
    empresasPorCodigo.set(codigoEmpresa, empresa);

    const contato = montarContato(row, codigoEmpresa, documento);

    if (contato) {
      contatosPorChave.set(chaveContato(contato), contato);
    }
  }

  return {
    totalLinhas,
    empresas: [...empresasPorCodigo.values()],
    contatos: [...contatosPorChave.values()],
    linhasIgnoradas,
    erros
  };
}

function validarEstruturaCsv(headers: string[]) {
  const colunasAusentes = COLUNAS_OBRIGATORIAS.filter(
    (coluna) => !headers.includes(coluna)
  );

  if (colunasAusentes.length > 0) {
    throw new Error(
      `CSV com estrutura invalida. Colunas obrigatorias ausentes: ${colunasAusentes.join(", ")}.`
    );
  }
}

function isLinhaFiltro(row: CsvRow) {
  return campo(row, "Razão social").toLowerCase().startsWith("filtros utilizados:");
}

function campo(row: CsvRow, coluna: string) {
  return row.values[coluna]?.trim() ?? "";
}

function campoOpcional(row: CsvRow, coluna: string) {
  const valor = campo(row, coluna);
  return valor.length > 0 ? valor : null;
}

function montarContato(
  row: CsvRow,
  codigoEmpresa: string,
  documento: string
): ContatoCsv | null {
  const nome = campoOpcional(row, "Nome do Contato");
  const telefone = campoOpcional(row, "Telefone do Contato");
  const email = normalizarEmail(campoOpcional(row, "Email do Contato"));

  if (!nome && !telefone && !email) {
    return null;
  }

  return {
    codigoEmpresa,
    documento,
    linha: row.lineNumber,
    nome,
    telefone,
    email,
    cargo: campoOpcional(row, "Cargo do Contato"),
    departamento: campoOpcional(row, "Departamentos do Contato")
  };
}

function normalizarEmail(email: string | null) {
  return email ? email.trim().toLowerCase() : null;
}

function normalizarTextoChave(valor: string | null) {
  return (valor ?? "").trim().toLowerCase();
}

function chaveContato(contato: ContatoCsv) {
  if (contato.email) {
    return `${contato.codigoEmpresa}|email:${contato.email}`;
  }

  return `${contato.codigoEmpresa}|nome:${normalizarTextoChave(contato.nome)}|telefone:${normalizarTextoChave(contato.telefone)}`;
}

async function resolverUsuarioImportacao(usuarioId?: string) {
  if (usuarioId) {
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: usuarioId,
        ativo: true
      },
      select: {
        id: true,
        email: true
      }
    });

    if (!usuario) {
      throw new Error("Usuario informado para importacao nao existe ou esta inativo.");
    }

    return usuario;
  }

  const admin = await prisma.usuario.findFirst({
    where: {
      email: "admin@recalculo.local",
      ativo: true
    },
    select: {
      id: true,
      email: true
    }
  });

  if (!admin) {
    throw new Error(
      "Nenhum usuario informado e admin@recalculo.local nao existe ou esta inativo."
    );
  }

  return admin;
}

async function gravarImportacao(
  nomeArquivo: string,
  usuarioId: string,
  dados: DadosPreparados
) {
  return prisma.$transaction(async (tx) => {
    const erros = [...dados.erros];
    let empresasCriadas = 0;
    let empresasAtualizadas = 0;
    let contatosCriados = 0;
    let linhasIgnoradas = dados.linhasIgnoradas;
    const empresasPorChave = new Map<string, string>();

    for (const empresa of dados.empresas) {
      const empresaExistente = await tx.empresa.findFirst({
        where: {
          OR: [
            {
              codigoEmpresa: empresa.codigoEmpresa
            },
            {
              documento: empresa.documento
            }
          ]
        }
      });

      if (
        empresaExistente &&
        (empresaExistente.codigoEmpresa !== empresa.codigoEmpresa ||
          empresaExistente.documento !== empresa.documento)
      ) {
        linhasIgnoradas += empresa.linhasOrigem.length;
        erros.push({
          linha: empresa.linhasOrigem[0],
          codigoEmpresa: empresa.codigoEmpresa,
          documento: empresa.documento,
          tipo: "conflito_empresa_existente",
          mensagem:
            "Empresa existente encontrada com mesmo codigo ou documento, mas com outro par codigo/documento. Linha nao sobrescrita."
        });
        continue;
      }

      const dadosEmpresa = {
        codigoEmpresa: empresa.codigoEmpresa,
        documento: empresa.documento,
        tipoDocumento:
          empresa.tipoDocumento === "CPF" ? TipoDocumento.CPF : TipoDocumento.CNPJ,
        nome: empresa.nome,
        nomeFantasia: empresa.nomeFantasia,
        ativa: true
      };

      const empresaSalva = empresaExistente
        ? await tx.empresa.update({
            where: {
              id: empresaExistente.id
            },
            data: dadosEmpresa
          })
        : await tx.empresa.create({
            data: dadosEmpresa
          });

      if (empresaExistente) {
        empresasAtualizadas += 1;
      } else {
        empresasCriadas += 1;
      }

      empresasPorChave.set(empresa.codigoEmpresa, empresaSalva.id);
      empresasPorChave.set(empresa.documento, empresaSalva.id);
    }

    for (const contato of dados.contatos) {
      const empresaId =
        empresasPorChave.get(contato.codigoEmpresa) ??
        empresasPorChave.get(contato.documento);

      if (!empresaId) {
        continue;
      }

      const contatoExistente = await buscarContatoExistente(tx, empresaId, contato);

      if (contatoExistente) {
        continue;
      }

      await tx.contatoEmpresa.create({
        data: {
          empresaId,
          nome: contato.nome ?? "",
          telefone: contato.telefone,
          email: contato.email,
          cargo: contato.cargo,
          departamento: contato.departamento,
          ativo: true
        }
      });
      contatosCriados += 1;
    }

    const importacao = await tx.importacaoEmpresa.create({
      data: {
        nomeArquivo,
        usuarioId,
        totalLinhas: dados.totalLinhas,
        empresasCriadas,
        empresasAtualizadas,
        contatosCriados,
        linhasIgnoradas,
        erros: erros as Prisma.InputJsonValue
      }
    });

    const resumoAuditoria = {
      nomeArquivo,
      totalLinhas: dados.totalLinhas,
      empresasCriadas,
      empresasAtualizadas,
      contatosCriados,
      linhasIgnoradas,
      totalErros: erros.length
    };

    const auditoria = await registrarImportacaoEmpresas(tx, {
      usuarioId,
      importacaoId: importacao.id,
      resumo: resumoAuditoria
    });

    return {
      importacaoId: importacao.id,
      auditoriaId: auditoria.id,
      totalLinhas: dados.totalLinhas,
      empresasValidas: dados.empresas.length,
      contatosValidos: dados.contatos.length,
      empresasCriadas,
      empresasAtualizadas,
      contatosCriados,
      linhasIgnoradas,
      erros
    };
  });
}

async function buscarContatoExistente(
  client: Pick<Prisma.TransactionClient, "contatoEmpresa">,
  empresaId: string,
  contato: ContatoCsv
) {
  if (contato.email) {
    return client.contatoEmpresa.findFirst({
      where: {
        empresaId,
        email: {
          equals: contato.email,
          mode: "insensitive"
        }
      }
    });
  }

  const where: Prisma.ContatoEmpresaWhereInput = {
    empresaId
  };

  if (contato.nome) {
    where.nome = {
      equals: contato.nome,
      mode: "insensitive"
    };
  }

  if (contato.telefone) {
    where.telefone = contato.telefone;
  }

  return client.contatoEmpresa.findFirst({
    where
  });
}
