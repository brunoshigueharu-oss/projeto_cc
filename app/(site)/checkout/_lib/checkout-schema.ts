import { z } from "zod";

export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const newAddressSchema = z.object({
  street: z.string().trim().min(2, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim().optional(),
  neighborhood: z.string().trim().min(2, "Informe o bairro."),
  city: z.string().trim().min(2, "Informe a cidade."),
  state: z.enum(UF_LIST, { message: "Escolha a UF." }),
  postalCode: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."),
});

export type NewAddressInput = z.infer<typeof newAddressSchema>;
