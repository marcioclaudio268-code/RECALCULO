-- CreateEnum
CREATE TYPE "perfil_usuario" AS ENUM ('ADMIN', 'OPERADOR');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "perfil" "perfil_usuario" NOT NULL DEFAULT 'OPERADOR';
