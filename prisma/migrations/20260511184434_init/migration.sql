-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('CPF', 'CNPJ');

-- CreateEnum
CREATE TYPE "tipo_guia" AS ENUM ('DAS', 'DARF', 'GPS', 'FGTS', 'ICMS', 'ISS', 'DAE', 'GARE', 'PARCELAMENTO', 'OUTROS');

-- CreateEnum
CREATE TYPE "status_recalculo" AS ENUM ('LANCADO', 'EM_REVISAO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "acao_auditoria" AS ENUM ('CRIACAO', 'EDICAO', 'CANCELAMENTO', 'IMPORTACAO', 'ANEXO_ADICIONADO', 'ANEXO_REMOVIDO', 'LOGIN');

-- CreateEnum
CREATE TYPE "entidade_auditoria" AS ENUM ('USUARIO', 'EMPRESA', 'CONTATO_EMPRESA', 'IMPORTACAO_EMPRESAS', 'RECALCULO_GUIA', 'EVIDENCIA_SOLICITACAO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "codigo_empresa" VARCHAR(50) NOT NULL,
    "documento" VARCHAR(20) NOT NULL,
    "tipo_documento" "tipo_documento" NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "nome_fantasia" VARCHAR(255),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contatos_empresa" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "telefone" VARCHAR(30),
    "email" VARCHAR(255),
    "cargo" VARCHAR(120),
    "departamento" VARCHAR(120),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contatos_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacoes_empresas" (
    "id" UUID NOT NULL,
    "nome_arquivo" VARCHAR(255) NOT NULL,
    "usuario_id" UUID NOT NULL,
    "total_linhas" INTEGER NOT NULL DEFAULT 0,
    "empresas_criadas" INTEGER NOT NULL DEFAULT 0,
    "empresas_atualizadas" INTEGER NOT NULL DEFAULT 0,
    "contatos_criados" INTEGER NOT NULL DEFAULT 0,
    "linhas_ignoradas" INTEGER NOT NULL DEFAULT 0,
    "erros" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacoes_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recalculos_guias" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo_guia" "tipo_guia" NOT NULL,
    "competencia" VARCHAR(7) NOT NULL,
    "descricao" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "solicitante" VARCHAR(255) NOT NULL,
    "data_solicitacao" TIMESTAMP(3) NOT NULL,
    "data_recalculo" TIMESTAMP(3),
    "responsavel_id" UUID,
    "status" "status_recalculo" NOT NULL DEFAULT 'LANCADO',
    "observacoes" TEXT,
    "criado_por_id" UUID NOT NULL,
    "atualizado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recalculos_guias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias_solicitacao" (
    "id" UUID NOT NULL,
    "recalculo_id" UUID NOT NULL,
    "nome_arquivo" VARCHAR(255) NOT NULL,
    "caminho_arquivo" VARCHAR(500) NOT NULL,
    "tipo_arquivo" VARCHAR(120) NOT NULL,
    "tamanho_arquivo" INTEGER NOT NULL,
    "enviado_por_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "entidade" "entidade_auditoria" NOT NULL,
    "entidade_id" UUID NOT NULL,
    "acao" "acao_auditoria" NOT NULL,
    "campo_alterado" VARCHAR(120),
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_codigo_empresa_key" ON "empresas"("codigo_empresa");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_documento_key" ON "empresas"("documento");

-- CreateIndex
CREATE INDEX "idx_empresas_nome" ON "empresas"("nome");

-- CreateIndex
CREATE INDEX "idx_contatos_empresa_empresa_id" ON "contatos_empresa"("empresa_id");

-- CreateIndex
CREATE INDEX "idx_importacoes_empresas_usuario_id" ON "importacoes_empresas"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_recalculos_guias_empresa_id" ON "recalculos_guias"("empresa_id");

-- CreateIndex
CREATE INDEX "idx_recalculos_guias_data_recalculo" ON "recalculos_guias"("data_recalculo");

-- CreateIndex
CREATE INDEX "idx_recalculos_guias_competencia" ON "recalculos_guias"("competencia");

-- CreateIndex
CREATE INDEX "idx_recalculos_guias_status" ON "recalculos_guias"("status");

-- CreateIndex
CREATE INDEX "idx_recalculos_guias_responsavel_id" ON "recalculos_guias"("responsavel_id");

-- CreateIndex
CREATE INDEX "idx_evidencias_solicitacao_recalculo_id" ON "evidencias_solicitacao"("recalculo_id");

-- CreateIndex
CREATE INDEX "idx_auditorias_usuario_id" ON "auditorias"("usuario_id");

-- CreateIndex
CREATE INDEX "idx_auditorias_entidade" ON "auditorias"("entidade");

-- CreateIndex
CREATE INDEX "idx_auditorias_entidade_id" ON "auditorias"("entidade_id");

-- CreateIndex
CREATE INDEX "idx_auditorias_criado_em" ON "auditorias"("criado_em");

-- AddForeignKey
ALTER TABLE "contatos_empresa" ADD CONSTRAINT "contatos_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacoes_empresas" ADD CONSTRAINT "importacoes_empresas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recalculos_guias" ADD CONSTRAINT "recalculos_guias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recalculos_guias" ADD CONSTRAINT "recalculos_guias_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recalculos_guias" ADD CONSTRAINT "recalculos_guias_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recalculos_guias" ADD CONSTRAINT "recalculos_guias_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_solicitacao" ADD CONSTRAINT "evidencias_solicitacao_recalculo_id_fkey" FOREIGN KEY ("recalculo_id") REFERENCES "recalculos_guias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias_solicitacao" ADD CONSTRAINT "evidencias_solicitacao_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
