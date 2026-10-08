import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";

const sendPasswordResetEmail = vi.hoisted(() => vi.fn());
vi.mock("@/lib/wix/members-auth", () => ({ sendPasswordResetEmail }));

import { EsqueciSenhaForm } from "./esqueci-senha-form";

const NEUTRAL = "Se esse e-mail tiver cadastro, enviamos um link para redefinir a senha.";
const FAILURE = "Não foi possível concluir o pedido agora";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

// React escuta o setter nativo: atribuir `.value` direto não dispara onChange.
const setNativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

async function submit(email = "ana@exemplo.com") {
  const input = container.querySelector<HTMLInputElement>("#email")!;
  await act(async () => {
    setNativeValue.call(input, email);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

function httpError(status: number) {
  return Object.assign(new Error(`Wix API error ${status}`), { status });
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
  sendPasswordResetEmail.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(() => root.render(<EsqueciSenhaForm />));
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("EsqueciSenhaForm", () => {
  it("responde de forma neutra quando o pedido é aceito", async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);
    await submit();
    expect(container.textContent).toContain(NEUTRAL);
  });

  it("dá a mesma resposta neutra quando o Wix recusa o e-mail (conta inexistente)", async () => {
    sendPasswordResetEmail.mockRejectedValue(httpError(404));
    await submit();
    expect(container.textContent).toContain(NEUTRAL);
    expect(container.textContent).not.toContain(FAILURE);
  });

  it.each([
    ["falha de rede", new TypeError("Failed to fetch")],
    ["erro do servidor", httpError(503)],
    ["limite de requisições", httpError(429)],
  ])("avisa que não concluiu em %s e permite repetir", async (_label, error) => {
    sendPasswordResetEmail.mockRejectedValueOnce(error);
    await submit();
    expect(container.textContent).toContain(FAILURE);
    expect(container.textContent).not.toContain(NEUTRAL);

    sendPasswordResetEmail.mockResolvedValue(undefined);
    await submit();
    expect(container.textContent).toContain(NEUTRAL);
    expect(container.textContent).not.toContain(FAILURE);
  });

  it("não mantém a confirmação anterior enquanto um novo envio está pendente", async () => {
    sendPasswordResetEmail.mockResolvedValueOnce(undefined);
    await submit();
    expect(container.textContent).toContain(NEUTRAL);

    let finish!: () => void;
    sendPasswordResetEmail.mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve; }));
    await submit();
    expect(container.textContent).not.toContain(NEUTRAL);

    await act(async () => finish());
    expect(container.textContent).toContain(NEUTRAL);
  });
});
