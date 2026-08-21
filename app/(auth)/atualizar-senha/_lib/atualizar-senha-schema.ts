import { z } from "zod";

export const atualizarSenhaSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type AtualizarSenhaInput = z.infer<typeof atualizarSenhaSchema>;

export type AtualizarSenhaResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};
