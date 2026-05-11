import { compare, hash } from "bcryptjs";
import {
  AcaoAuditoria,
  EntidadeAuditoria,
  StatusRecalculo,
  TipoDocumento,
  TipoGuia
} from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";

const adminEmail = "admin@recalculo.local";
const adminPassword = "admin123";
const empresaDocumento = "11222333000181";
const empresaCodigo = "001";
const contatoEmail = "contato@empresaexemplo.local";
const recalculoDescricao = "Recálculo de guia DAS solicitado para validação do ambiente";
const dataSolicitacao = new Date("2026-05-11T09:00:00.000-03:00");
const dataRecalculo = new Date("2026-05-11T11:00:00.000-03:00");

async function seedUsuarioAdmin() {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      email: adminEmail
    }
  });

  if (!usuarioExistente) {
    return prisma.usuario.create({
      data: {
        nome: "Admin Local",
        email: adminEmail,
        senhaHash: await hash(adminPassword, 10),
        ativo: true
      }
    });
  }

  const senhaConfere = await compare(adminPassword, usuarioExistente.senhaHash);
  const precisaAtualizar =
    usuarioExistente.nome !== "Admin Local" ||
    usuarioExistente.ativo !== true ||
    !senhaConfere;

  if (!precisaAtualizar) {
    return usuarioExistente;
  }

  return prisma.usuario.update({
    where: {
      id: usuarioExistente.id
    },
    data: {
      nome: "Admin Local",
      ativo: true,
      ...(senhaConfere ? {} : { senhaHash: await hash(adminPassword, 10) })
    }
  });
}

async function seedEmpresa() {
  const empresaExistente = await prisma.empresa.findFirst({
    where: {
      OR: [
        {
          codigoEmpresa: empresaCodigo
        },
        {
          documento: empresaDocumento
        }
      ]
    }
  });

  const dadosEmpresa = {
    codigoEmpresa: empresaCodigo,
    documento: empresaDocumento,
    tipoDocumento: TipoDocumento.CNPJ,
    nome: "Empresa Exemplo LTDA",
    nomeFantasia: "Empresa Exemplo",
    ativa: true
  };

  if (!empresaExistente) {
    return prisma.empresa.create({
      data: dadosEmpresa
    });
  }

  return prisma.empresa.update({
    where: {
      id: empresaExistente.id
    },
    data: dadosEmpresa
  });
}

async function seedContato(empresaId: string) {
  const contatoExistente = await prisma.contatoEmpresa.findFirst({
    where: {
      empresaId,
      email: contatoEmail
    }
  });

  const dadosContato = {
    empresaId,
    nome: "Contato Exemplo",
    telefone: "(14) 99999-0000",
    email: contatoEmail,
    cargo: "Responsável Administrativo",
    departamento: "Financeiro",
    ativo: true
  };

  if (!contatoExistente) {
    return prisma.contatoEmpresa.create({
      data: dadosContato
    });
  }

  return prisma.contatoEmpresa.update({
    where: {
      id: contatoExistente.id
    },
    data: dadosContato
  });
}

async function seedRecalculo(empresaId: string, usuarioId: string) {
  const recalculoExistente = await prisma.recalculoGuia.findFirst({
    where: {
      empresaId,
      tipoGuia: TipoGuia.DAS,
      competencia: "2026-05",
      descricao: recalculoDescricao
    }
  });

  const dadosRecalculo = {
    empresaId,
    tipoGuia: TipoGuia.DAS,
    competencia: "2026-05",
    descricao: recalculoDescricao,
    motivo: "Seed de desenvolvimento",
    solicitante: "Contato Exemplo",
    dataSolicitacao,
    dataRecalculo,
    responsavelId: usuarioId,
    status: StatusRecalculo.LANCADO,
    observacoes: "Registro criado automaticamente pelo seed de desenvolvimento",
    criadoPorId: usuarioId,
    atualizadoPorId: usuarioId
  };

  if (!recalculoExistente) {
    const recalculo = await prisma.recalculoGuia.create({
      data: dadosRecalculo
    });

    return {
      recalculo,
      criado: true
    };
  }

  const recalculo = await prisma.recalculoGuia.update({
    where: {
      id: recalculoExistente.id
    },
    data: dadosRecalculo
  });

  return {
    recalculo,
    criado: false
  };
}

async function seedAuditoria(usuarioId: string, recalculoId: string) {
  const auditoriaExistente = await prisma.auditoria.findFirst({
    where: {
      usuarioId,
      entidade: EntidadeAuditoria.RECALCULO_GUIA,
      entidadeId: recalculoId,
      acao: AcaoAuditoria.CRIACAO
    }
  });

  if (auditoriaExistente) {
    return {
      auditoria: auditoriaExistente,
      criada: false
    };
  }

  const auditoria = await prisma.auditoria.create({
    data: {
      usuarioId,
      entidade: EntidadeAuditoria.RECALCULO_GUIA,
      entidadeId: recalculoId,
      acao: AcaoAuditoria.CRIACAO,
      campoAlterado: null,
      valorAnterior: null,
      valorNovo: JSON.stringify({
        tipoGuia: TipoGuia.DAS,
        competencia: "2026-05",
        descricao: recalculoDescricao,
        status: StatusRecalculo.LANCADO
      })
    }
  });

  return {
    auditoria,
    criada: true
  };
}

async function main() {
  const admin = await seedUsuarioAdmin();
  const empresa = await seedEmpresa();
  const contato = await seedContato(empresa.id);
  const { recalculo, criado: recalculoCriado } = await seedRecalculo(
    empresa.id,
    admin.id
  );
  const { auditoria, criada: auditoriaCriada } = await seedAuditoria(
    admin.id,
    recalculo.id
  );

  console.log("Seed de desenvolvimento concluído.");
  console.table([
    { entidade: "Usuario", id: admin.id, chave: admin.email },
    { entidade: "Empresa", id: empresa.id, chave: empresa.codigoEmpresa },
    { entidade: "ContatoEmpresa", id: contato.id, chave: contato.email },
    {
      entidade: "RecalculoGuia",
      id: recalculo.id,
      chave: `${recalculo.tipoGuia}/${recalculo.competencia}`,
      criado: recalculoCriado
    },
    {
      entidade: "Auditoria",
      id: auditoria.id,
      chave: auditoria.acao,
      criado: auditoriaCriada
    }
  ]);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de desenvolvimento.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
