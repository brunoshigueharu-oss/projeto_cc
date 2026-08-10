"use server";

import { z } from "zod";

import {
  contactSchema,
  type ContactInput,
  type ContactResult,
} from "../_lib/contact-schema";

export async function sendMessage(input: ContactInput): Promise<ContactResult> {
  // Revalidação no servidor: a validação do cliente é conveniência de UX, não
  // barreira de segurança — a action pode ser chamada diretamente.
  const validation = contactSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false,
      message: "Confira os campos destacados.",
      // Zod 4: `.flatten()` está descontinuado em favor de `z.flattenError`.
      errors: z.flattenError(validation.error).fieldErrors,
    };
  }

  // Honeypot preenchido = bot. Responde como sucesso para não dar pista.
  if (validation.data.website) {
    return { success: true, message: "Mensagem enviada." };
  }

  // TODO: integrar provedor de e-mail (Resend/SendGrid) quando houver conta.
  // Até lá a mensagem é validada e descartada — nada é persistido nem enviado.

  return {
    success: true,
    message:
      "Mensagem recebida. Respondemos em até cinco dias úteis — costuma ser antes.",
  };
}
