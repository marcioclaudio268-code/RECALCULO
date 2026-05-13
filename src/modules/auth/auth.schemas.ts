import { z } from "zod";

export const loginBodySchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, "Informe o usuario ou e-mail.")
    .transform((value) => value.toLowerCase()),
  senha: z.string().min(1, "Informe a senha.")
});

export type LoginBody = z.infer<typeof loginBodySchema>;
