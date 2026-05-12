import { z } from "zod";

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email("Informe um e-mail valido.")
    .transform((value) => value.toLowerCase()),
  senha: z.string().min(1, "Informe a senha.")
});

export type LoginBody = z.infer<typeof loginBodySchema>;
