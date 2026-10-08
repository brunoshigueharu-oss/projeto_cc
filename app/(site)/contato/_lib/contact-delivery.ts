import type { ContactInput } from "./contact-schema";

export type ContactMessage = Omit<ContactInput, "website">;

/**
 * Entrega a mensagem à equipe. Deve REJEITAR quando o provedor não aceitar o
 * envio — a Server Action só responde "sucesso" se esta Promise resolver.
 */
export type ContactDelivery = (message: ContactMessage) => Promise<void>;

/**
 * Ainda não há provedor de e-mail contratado (Resend/SendGrid), então não há
 * entrega: `null` faz a página trocar o formulário por um aviso com os canais
 * diretos, e a action recusar o envio em vez de confirmar uma mensagem que
 * ninguém vai receber. Ao contratar um provedor, este é o único ponto a
 * implementar.
 */
export const contactDelivery: ContactDelivery | null = null;

/** Canal real para onde encaminhar quem não conseguiu usar o formulário. */
export const CONTACT_FALLBACK_EMAIL = "pedidos@hocuspocus.com.br";
