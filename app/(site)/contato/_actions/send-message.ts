"use server";

import { z } from "zod";

import { CONTACT_FALLBACK_EMAIL, contactDelivery } from "../_lib/contact-delivery";
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

  const { website, ...message } = validation.data;

  // Honeypot preenchido = bot. Responde como sucesso para não dar pista.
  if (website) {
    return { success: true, message: "Mensagem enviada." };
  }

  // Sem provedor não há entrega — nunca confirmar o que não foi enviado.
  if (!contactDelivery) {
    return {
      success: false,
      message: `O formulário está fora do ar e sua mensagem não foi enviada. Escreva para ${CONTACT_FALLBACK_EMAIL}.`,
    };
  }

  try {
    await contactDelivery(message);
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: `Não foi possível enviar sua mensagem. Tente novamente ou escreva para ${CONTACT_FALLBACK_EMAIL}.`,
    };
  }

  return {
    success: true,
    message: "Mensagem enviada. Respondemos em até cinco dias úteis.",
  };
}
