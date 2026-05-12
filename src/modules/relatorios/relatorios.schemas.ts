import { z } from "zod";

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve usar o formato YYYY-MM-DD.");

const booleanQuerySchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .optional()
  .default(false)
  .transform((value) => value === true || value === "true");

export const relatorioRecalculosQuerySchema = z.object({
  dataInicio: dateOnlySchema,
  dataFim: dateOnlySchema,
  incluirCancelados: booleanQuerySchema
});

export const relatorioRecalculosHeadersSchema = z.object({
  "x-user-id": z.string().uuid("Header x-user-id deve ser um UUID valido.")
});

export type RelatorioRecalculosQuery = z.infer<
  typeof relatorioRecalculosQuerySchema
>;
