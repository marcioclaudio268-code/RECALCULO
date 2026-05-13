import { z } from "zod";

export const perfilUsuarioValues = ["ADMIN", "OPERADOR"] as const;

const loginSchema = z
  .string()
  .trim()
  .min(3, "Login deve ter pelo menos 3 caracteres.")
  .max(80, "Login deve ter no maximo 80 caracteres.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Use apenas letras, numeros, ponto, hifen ou underline."
  )
  .transform((value) => value.toLowerCase());

const emailSchema = z
  .string()
  .trim()
  .email("E-mail invalido.")
  .transform((value) => value.toLowerCase());

const emailOpcionalSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    return trimmed;
  },
  emailSchema.nullable()
);

const emailCriacaoSchema = emailOpcionalSchema
  .optional()
  .transform((value) => value ?? null);

const emailEdicaoSchema = emailOpcionalSchema.optional();

export const usuarioParamsSchema = z.object({
  id: z.string().uuid()
});

export const criarUsuarioBodySchema = z
  .object({
    nome: z.string().trim().min(1, "Nome obrigatorio."),
    login: loginSchema,
    email: emailCriacaoSchema,
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
    perfil: z.enum(perfilUsuarioValues).default("OPERADOR"),
    ativo: z.boolean().optional()
  })
  .strict();

export const editarUsuarioBodySchema = z
  .object({
    nome: z.string().trim().min(1, "Nome obrigatorio.").optional(),
    login: loginSchema.optional(),
    email: emailEdicaoSchema,
    perfil: z.enum(perfilUsuarioValues).optional(),
    ativo: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar."
  });

export const alterarSenhaUsuarioBodySchema = z
  .object({
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.")
  })
  .strict();

export type CriarUsuarioBody = z.infer<typeof criarUsuarioBodySchema>;
export type EditarUsuarioBody = z.infer<typeof editarUsuarioBodySchema>;
export type AlterarSenhaUsuarioBody = z.infer<
  typeof alterarSenhaUsuarioBodySchema
>;