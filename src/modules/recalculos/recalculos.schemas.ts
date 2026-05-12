import { z } from "zod";

export const tipoGuiaValues = [
  "DAS",
  "DARF",
  "GPS",
  "FGTS",
  "ICMS",
  "ISS",
  "DAE",
  "GARE",
  "PARCELAMENTO",
  "OUTROS"
] as const;

export const statusRecalculoValues = [
  "LANCADO",
  "EM_REVISAO",
  "FINALIZADO",
  "CANCELADO"
] as const;

const dateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Data invalida."
  })
  .transform((value) => new Date(value));

const queryDateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Data invalida."
  });

const optionalTextSchema = z.string().trim().min(1).optional();

export const listarRecalculosQuerySchema = z.object({
  empresaId: z.string().uuid().optional(),
  status: z.enum(statusRecalculoValues).optional(),
  tipoGuia: z.enum(tipoGuiaValues).optional(),
  competencia: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competencia deve usar o formato YYYY-MM.")
    .optional(),
  dataInicio: queryDateStringSchema.optional(),
  dataFim: queryDateStringSchema.optional(),
  responsavelId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const criarRecalculoBodySchema = z.object({
  empresaId: z.string().uuid(),
  tipoGuia: z.enum(tipoGuiaValues),
  competencia: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competencia deve usar o formato YYYY-MM."),
  descricao: z.string().trim().min(1, "Descricao nao pode ser vazia."),
  dataRecalculo: dateStringSchema,
  responsavelId: z.string().uuid(),
  motivo: optionalTextSchema,
  solicitante: optionalTextSchema,
  dataSolicitacao: dateStringSchema.optional(),
  observacoes: optionalTextSchema
});

export const criarRecalculoHeadersSchema = z.object({
  "x-user-id": z.string().uuid()
});

export const recalculoParamsSchema = z.object({
  id: z.string().uuid()
});

export type ListarRecalculosQuery = z.infer<typeof listarRecalculosQuerySchema>;
export type CriarRecalculoBody = z.infer<typeof criarRecalculoBodySchema>;
