/*
  Warnings:

  - Made the column `data_recalculo` on table `recalculos_guias` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "auditorias" DROP CONSTRAINT "auditorias_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "recalculos_guias" DROP CONSTRAINT "recalculos_guias_responsavel_id_fkey";

-- AlterTable
ALTER TABLE "recalculos_guias" ALTER COLUMN "data_recalculo" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "recalculos_guias" ADD CONSTRAINT "recalculos_guias_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
