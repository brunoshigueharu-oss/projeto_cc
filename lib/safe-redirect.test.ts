import { describe, expect, it } from "vitest";

import { getSafeRedirect } from "./safe-redirect";

const ORIGIN = "https://site.com";

describe("getSafeRedirect", () => {
  it("mantém caminhos internos com query e hash", () => {
    expect(getSafeRedirect("/perfil", ORIGIN, "/x")).toBe("/perfil");
    expect(getSafeRedirect("/checkout?step=2#pagamento", ORIGIN, "/x")).toBe(
      "/checkout?step=2#pagamento",
    );
  });

  it("usa o fallback quando não há valor", () => {
    expect(getSafeRedirect(undefined, ORIGIN, "/perfil")).toBe("/perfil");
    expect(getSafeRedirect("", ORIGIN, "/perfil")).toBe("/perfil");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "javascript:alert(1)",
    "perfil",
  ])("recusa destino externo ou malformado: %j", (value) => {
    expect(getSafeRedirect(value, ORIGIN, "/perfil")).toBe("/perfil");
  });
});
