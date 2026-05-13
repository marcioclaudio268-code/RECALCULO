-- Align usuarios table with local-login schema in existing databases.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario') THEN
    CREATE TYPE "perfil_usuario" AS ENUM ('ADMIN', 'OPERADOR');
  END IF;
END $$;

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "login" VARCHAR(80);

UPDATE "usuarios"
SET "email" = NULL
WHERE "email" = 'null';

UPDATE "usuarios"
SET "login" = lower(split_part("email", '@', 1))
WHERE "login" IS NULL
  AND "email" IS NOT NULL;

UPDATE "usuarios"
SET "login" = 'usuario-' || substr("id"::text, 1, 8)
WHERE "login" IS NULL;

UPDATE "usuarios"
SET "login" = 'admin'
WHERE "email" = 'admin@recalculo.local'
  AND NOT EXISTS (
    SELECT 1 FROM "usuarios" WHERE "login" = 'admin'
  );

UPDATE "usuarios"
SET "login" = 'dp-aline'
WHERE "login" = 'dp-alien'
  AND NOT EXISTS (
    SELECT 1 FROM "usuarios" WHERE "login" = 'dp-aline'
  );

WITH duplicados AS (
  SELECT
    "id",
    "login",
    row_number() OVER (PARTITION BY "login" ORDER BY "criado_em", "id") AS rn
  FROM "usuarios"
  WHERE "login" IS NOT NULL
)
UPDATE "usuarios" u
SET "login" = left(d."login", 70) || '-' || substr(u."id"::text, 1, 8)
FROM duplicados d
WHERE u."id" = d."id"
  AND d.rn > 1;

ALTER TABLE "usuarios" ALTER COLUMN "login" SET NOT NULL;
ALTER TABLE "usuarios" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "perfil" "perfil_usuario" NOT NULL DEFAULT 'OPERADOR';

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_login_key" ON "usuarios"("login");
