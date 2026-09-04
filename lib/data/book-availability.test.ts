import { describe, expect, it } from "vitest";

import { resolveCartAvailability } from "./book-availability";

describe("resolveCartAvailability", () => {
  it("bloqueia por status quando purchasableByStatus é false, mesmo com wixProductId", () => {
    const result = resolveCartAvailability("prod-1", false);
    expect(result).toEqual({ available: false, unavailableReason: "esgotado", wixProductId: "prod-1" });
  });

  it("bloqueia por falta de produto Wix quando o status permite compra", () => {
    const result = resolveCartAvailability(undefined, true);
    expect(result).toEqual({ available: false, unavailableReason: "sem-produto-wix", wixProductId: undefined });
  });

  it("libera só quando status permite compra E existe wixProductId", () => {
    const result = resolveCartAvailability("prod-1", true);
    expect(result).toEqual({ available: true, unavailableReason: null, wixProductId: "prod-1" });
  });

  it("prioriza o motivo 'esgotado' quando os dois bloqueios se aplicam", () => {
    const result = resolveCartAvailability(undefined, false);
    expect(result.unavailableReason).toBe("esgotado");
  });

  it("assume purchasableByStatus true quando omitido — caso do combo, que não tem status", () => {
    const result = resolveCartAvailability("prod-1");
    expect(result).toEqual({ available: true, unavailableReason: null, wixProductId: "prod-1" });
  });
});
