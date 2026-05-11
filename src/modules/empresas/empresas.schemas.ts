import { z } from "zod";

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return value;
}, z.boolean().optional());

export const listarEmpresasQuerySchema = z.object({
  busca: z.string().trim().min(1).optional(),
  ativa: booleanQuerySchema,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const empresaParamsSchema = z.object({
  id: z.string().uuid()
});

export type ListarEmpresasQuery = z.infer<typeof listarEmpresasQuerySchema>;
