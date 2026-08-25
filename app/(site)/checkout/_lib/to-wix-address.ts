import type { WixAddress } from "@/lib/wix/ecom";

import type { NewAddressInput } from "./checkout-schema";

/**
 * Mapeia o formulário de endereço BR pro formato de endereço da Wix
 * eCommerce. A Wix não tem campo de bairro nem complemento dedicados —
 * ambos vão concatenados em `addressLine2`. `subdivision` ISO 3166-2:BR é
 * sempre `BR-<UF>`, coincidindo com a sigla de 2 letras do formulário.
 */
export function toWixAddress(input: NewAddressInput): WixAddress {
  return {
    country: "BR",
    countryFullname: "Brasil",
    subdivision: `BR-${input.state}`,
    city: input.city,
    postalCode: input.postalCode.replace(/\D/g, ""),
    streetAddress: { name: input.street, number: input.number },
    addressLine2: [input.neighborhood, input.complement].filter(Boolean).join(", "),
  };
}
