import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";

const auth = vi.hoisted(() => {
  class MemberAuthError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  }
  return { login: vi.fn(), verifyEmail: vi.fn(), MemberAuthError };
});
const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/wix/members-auth", () => auth);
vi.mock("@/lib/wix/member-context", () => ({ useMember: () => ({ refresh }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { LoginForm } from "./login-form";

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

// React escuta o setter nativo: atribuir `.value` direto não dispara onChange.
const setNativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

async function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(selector)!;
  expect(input).toBeTruthy();
  await act(async () => {
    setNativeValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

async function mount(redirectTo?: string) {
  root = createRoot(container);
  await act(() => root.render(<LoginForm redirectTo={redirectTo} />));
}

async function signIn() {
  await fill("#email", "ana@exemplo.com");
  await fill("#password", "senha-secreta");
  await submit();
}

async function clickButton(label: string) {
  const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent === label)!;
  expect(button).toBeTruthy();
  await act(async () => button.click());
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
  auth.login.mockReset();
  auth.verifyEmail.mockReset();
  push.mockReset();
  refresh.mockClear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("LoginForm", () => {
  it("entra e leva ao destino seguro pedido", async () => {
    auth.login.mockResolvedValue({ state: "SUCCESS" });
    await mount("/checkout");
    await signIn();
    expect(refresh).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/checkout");
  });

  it("ignora destino externo", async () => {
    auth.login.mockResolvedValue({ state: "SUCCESS" });
    await mount("//evil.example");
    await signIn();
    expect(push).toHaveBeenCalledWith("/perfil");
  });

  it("pede o código quando o Wix exige verificação e conclui preservando o destino", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "token-1" });
    auth.verifyEmail.mockResolvedValue({ state: "SUCCESS" });
    await mount("/checkout");
    await signIn();

    expect(container.querySelector("#code")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();

    await fill("#code", "123456");
    await submit();

    expect(auth.verifyEmail).toHaveBeenCalledWith("123456", "token-1");
    expect(refresh).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/checkout");
  });

  it("mantém a etapa do código quando ele é inválido e deixa tentar de novo", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "token-1" });
    auth.verifyEmail.mockRejectedValueOnce(new Error("invalid code")).mockResolvedValue({ state: "SUCCESS" });
    await mount();
    await signIn();
    await fill("#code", "000000");
    await submit();

    expect(container.textContent).toContain("Código inválido ou expirado");
    expect(push).not.toHaveBeenCalled();

    await fill("#code", "123456");
    await submit();
    expect(push).toHaveBeenCalledWith("/perfil");
  });

  it("oferece volta ao login quando o código expirou", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "token-1" });
    auth.verifyEmail.mockRejectedValue(new Error("expired"));
    await mount();
    await signIn();
    await fill("#code", "123456");
    await submit();
    await clickButton("Voltar ao login");

    expect(container.querySelector("#email")).toBeTruthy();
    expect(container.querySelector("#code")).toBeNull();
  });

  it("nunca mostra um formulário de código sem saída quando o token não veio", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION" });
    await mount();
    await signIn();

    expect(container.querySelector("#code")).toBeNull();
    expect(container.textContent).toContain("Não foi possível retomar a confirmação");
    await clickButton("Voltar ao login");
    expect(container.querySelector("#email")).toBeTruthy();
  });

  it("explica a aprovação pendente sem mandar conferir o e-mail", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_OWNER_APPROVAL" });
    await mount();
    await signIn();

    expect(container.textContent).toContain("aguardando aprovação");
    expect(container.textContent).not.toContain("Verifique seu e-mail");
    expect(container.querySelector("#code")).toBeNull();
  });

  it("retoma a verificação numa nova abertura do login", async () => {
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "token-1" });
    await mount();
    await signIn();
    expect(container.querySelector("#code")).toBeTruthy();

    await act(() => root.unmount());
    auth.login.mockResolvedValue({ state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "token-2" });
    auth.verifyEmail.mockResolvedValue({ state: "SUCCESS" });
    await mount();
    await signIn();
    await fill("#code", "654321");
    await submit();

    expect(auth.verifyEmail).toHaveBeenCalledWith("654321", "token-2");
    expect(push).toHaveBeenCalledWith("/perfil");
  });

  it("mostra credenciais incorretas", async () => {
    auth.login.mockRejectedValue(new auth.MemberAuthError("invalidCredentials"));
    await mount();
    await signIn();
    expect(container.textContent).toContain("E-mail ou senha incorretos.");
  });
});
