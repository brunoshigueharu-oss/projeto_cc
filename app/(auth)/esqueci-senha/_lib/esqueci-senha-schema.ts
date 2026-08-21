import { z } from "zod";

export const esqueciSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export type EsqueciSenhaInput = z.infer<typeof esqueciSenhaSchema>;

export type EsqueciSenhaResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};
