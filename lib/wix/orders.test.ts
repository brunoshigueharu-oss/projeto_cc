/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only to allow testing server code in jsdom environment
vi.mock("server-only", () => ({}));

import {
  translateFulfillmentStatus,
  translateOrderStatus,
  translatePaymentStatus,
} from "./orders";

describe("lib/wix/orders — tradução de status", () => {
  describe("translatePaymentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translatePaymentStatus("PAID")).toBe("Pago");
      expect(translatePaymentStatus("NOT_PAID")).toBe("Não pago");
      expect(translatePaymentStatus("PENDING")).toBe("Pagamento pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translatePaymentStatus("UNSPECIFIED")).toBe("UNSPECIFIED");
    });
  });

  describe("translateFulfillmentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translateFulfillmentStatus("FULFILLED")).toBe("Entregue");
      expect(translateFulfillmentStatus("NOT_FULFILLED")).toBe("Pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translateFulfillmentStatus("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    });
  });

  describe("translateOrderStatus", () => {
    it("retorna o label para CANCELED e REJECTED", () => {
      expect(translateOrderStatus("CANCELED")).toBe("Cancelado");
      expect(translateOrderStatus("REJECTED")).toBe("Rejeitado");
    });

    it("retorna null para status normais (não gera badge extra)", () => {
      expect(translateOrderStatus("APPROVED")).toBeNull();
      expect(translateOrderStatus("PENDING")).toBeNull();
      expect(translateOrderStatus("INITIALIZED")).toBeNull();
    });
  });
});
