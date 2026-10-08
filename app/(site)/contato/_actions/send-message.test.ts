import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContactInput } from "../_lib/contact-schema";

const delivery = vi.hoisted(() => ({
  current: null as ((message: unknown) => Promise<void>) | null,
}));

vi.mock("../_lib/contact-delivery", () => ({
  CONTACT_FALLBACK_EMAIL: "pedidos@hocuspocus.com.br",
  get contactDelivery() {
    return delivery.current;
  },
}));

import { sendMessage } from "./send-message";

const VALID: ContactInput = {
  name: "Ana Souza",
  email: "ana@exemplo.com",
  subject: "Pedido e envio",
  message: "Meu exemplar chegou com a lombada amassada.",
  website: "",
};

describe("sendMessage", () => {
  beforeEach(() => {
    delivery.current = null;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("não confirma envio enquanto não há provedor configurado e aponta um canal real", async () => {
    const result = await sendMessage(VALID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("pedidos@hocuspocus.com.br");
  });

  it("não entrega dados inválidos ao provedor", async () => {
    delivery.current = vi.fn(async () => {});

    const result = await sendMessage({ ...VALID, email: "sem-arroba", message: "curta" });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty("email");
    expect(result.errors).toHaveProperty("message");
    expect(delivery.current).not.toHaveBeenCalled();
  });

  it("só confirma depois que o provedor aceita a mensagem", async () => {
    delivery.current = vi.fn(async () => {});

    const result = await sendMessage(VALID);

    expect(delivery.current).toHaveBeenCalledWith({
      name: VALID.name,
      email: VALID.email,
      subject: VALID.subject,
      message: VALID.message,
    });
    expect(result.success).toBe(true);
  });

  it("não exibe sucesso quando o provedor falha", async () => {
    delivery.current = vi.fn(async () => {
      throw new Error("provider down");
    });

    const result = await sendMessage(VALID);

    expect(result.success).toBe(false);
    expect(result.message).toContain("pedidos@hocuspocus.com.br");
  });

  it("descarta envio de bot (honeypot) sem acionar o provedor", async () => {
    delivery.current = vi.fn(async () => {});

    const result = await sendMessage({ ...VALID, website: "http://spam.example" });

    expect(result.success).toBe(true);
    expect(delivery.current).not.toHaveBeenCalled();
  });
});
