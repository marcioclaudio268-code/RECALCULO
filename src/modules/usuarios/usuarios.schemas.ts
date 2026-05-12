import { z } from "zod";

export const perfilUsuarioValues = ["ADMIN", "OPERADOR"] as const;

const emailSchema = z
  .string()
  .trim()
  .email("E-mail invalido.")
  .transform((value) => value.toLowerCase());

export const usuarioParamsSchema = z.object({
  id: z.string().uuid()
});

export const criarUsuarioBodySchema = z
  .object({
    nome: z.string().trim().min(1, "Nome obrigatorio."),
    email: emailSchema,
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
    perfil: z.enum(perfilUsuarioValues).default("OPERADOR"),
    ativo: z.boolean().optional()
  })
  .strict();

export const editarUsuarioBodySchema = z
  .object({
    nome: z.string().trim().min(1, "Nome obrigatorio.").optional(),
    email: emailSchema.optional(),
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
