import { z } from "zod";

export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const newAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Informe o nome do destinatário."),
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.enum(UF_LIST, { message: "Escolha a UF." }),
  postalCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
  saveAsDefault: z.boolean(),
});

export type NewAddressInput = z.infer<typeof newAddressSchema>;

const cartItemSchema = z.object({
  item_type: z.enum(["book", "combo"]),
  book_slug: z.string().nullable(),
  combo_slug: z.string().nullable(),
  title_snapshot: z.string(),
  quantity: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
  total_price_cents: z.number().int().nonnegative(),
});

export const createOrderSchema = z
  .object({
    addressId: z.string().uuid().optional(),
    newAddress: newAddressSchema.optional(),
    items: z.array(cartItemSchema).min(1, "Seu carrinho está vazio."),
  })
  .refine((data) => Boolean(data.addressId) !== Boolean(data.newAddress), {
    message: "Informe um endereço de entrega.",
    path: ["addressId"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderResult = {
  success: boolean;
  message?: string;
  orderNumber?: string;
};
