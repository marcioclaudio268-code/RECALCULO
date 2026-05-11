/*
  Warnings:

  - Made the column `usuario_id` on table `auditorias` required. This step will fail if there are existing NULL values in that column.
  - Made the column `responsavel_id` on table `recalculos_guias` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "auditorias" ALTER COLUMN "usuario_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "recalculos_guias" ALTER COLUMN "motivo" DROP NOT NULL,
ALTER COLUMN "solicitante" DROP NOT NULL,
ALTER COLUMN "data_solicitacao" DROP NOT NULL,
ALTER COLUMN "responsavel_id" SET NOT NULL;
