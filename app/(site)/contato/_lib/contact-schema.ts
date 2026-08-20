import { z } from "zod";

/**
 * O schema mora aqui, e não junto da Server Action, por uma restrição do
 * Next: um arquivo com `"use server"` no topo só pode exportar funções async.
 * Exportar schema ou tipo de lá quebra o build.
 *
 * Assim o mesmo contrato é usado nos dois lados — resolver no cliente,
 * revalidação no servidor (nunca confie só na validação do navegador).
 */

export const CONTACT_SUBJECTS = [
  "Enviar original",
  "Pedido e envio",
  "Imprensa",
  "Outro assunto",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe pelo menos 2 caracteres.").max(80),
  email: z.email("Informe um e-mail válido."),
  subject: z.enum(CONTACT_SUBJECTS, { message: "Escolha um assunto." }),
  message: z
    .string()
    .trim()
    .min(20, "Conte um pouco mais — pelo menos 20 caracteres.")
    .max(2000, "Máximo de 2000 caracteres."),
  /**
   * Honeypot: bots preenchem, humanos não veem. Vazio é o esperado.
   *
   * Sem limite de tamanho aqui de propósito: se o schema rejeitasse um valor
   * não-vazio, `safeParse` falharia com um erro de validação citando o nome
   * do campo — denunciando o honeypot e pulando a resposta de "sucesso
   * falso" que a Server Action (`send-message.ts`) já implementa.
   */
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};
