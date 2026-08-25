import { describe, expect, it } from "vitest";

import { toWixAddress } from "./to-wix-address";

describe("toWixAddress", () => {
  it("mapeia os campos básicos e monta subdivision como BR-<UF>", () => {
    const result = toWixAddress({
      street: "Rua das Flores",
      number: "123",
      complement: undefined,
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01310-100",
    });

    expect(result).toEqual({
      country: "BR",
      countryFullname: "Brasil",
      subdivision: "BR-SP",
      city: "São Paulo",
      postalCode: "01310100",
      streetAddress: { name: "Rua das Flores", number: "123" },
      addressLine2: "Centro",
    });
  });

  it("concatena bairro e complemento em addressLine2 quando complemento existe", () => {
    const result = toWixAddress({
      street: "Av. Paulista",
      number: "1000",
      complement: "Apto 42",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      postalCode: "01310100",
    });

    expect(result.addressLine2).toBe("Bela Vista, Apto 42");
  });

  it("normaliza CEP sem hífen para o mesmo valor de um CEP com hífen", () => {
    const withHyphen = toWixAddress({
      street: "Rua A",
      number: "1",
      complement: undefined,
      neighborhood: "Bairro",
      city: "Cidade",
      state: "RJ",
      postalCode: "20000-000",
    });
    const withoutHyphen = toWixAddress({
      street: "Rua A",
      number: "1",
      complement: undefined,
      neighborhood: "Bairro",
      city: "Cidade",
      state: "RJ",
      postalCode: "20000000",
    });

    expect(withHyphen.postalCode).toBe("20000000");
    expect(withHyphen.postalCode).toBe(withoutHyphen.postalCode);
  });
});
