import { z } from "zod";

export const cadastroSchema = z.object({
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(80),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;

export type CadastroResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};
