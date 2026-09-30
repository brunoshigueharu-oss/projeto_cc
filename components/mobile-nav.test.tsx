import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cart/cart-context", () => ({ useCart: () => ({ itemCount: 3 }) }));
vi.mock("./nav-link", () => ({
  NavLink: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("./sign-out-button", () => ({ SignOutButton: () => <button>Sair</button> }));
import { MobileNav } from "./mobile-nav";

let container: HTMLDivElement;
let root: Root;
const key = (target: Element, value: string) => act(() => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true }));
});
const click = (target: HTMLElement) => act(() => target.click());

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<MobileNav isAuthenticated />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("MobileNav", () => {
  it("exposes count and keeps closed links inert", () => {
    const panel = container.querySelector("nav")!;
    expect(panel.textContent).toContain("Carrinho (3)");
    expect(panel.hasAttribute("inert")).toBe(true);
    click(container.querySelector("button")!);
    expect(panel.hasAttribute("inert")).toBe(false);
    expect(container.querySelector("button")!.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens with arrows, traverses links and restores focus on Escape", () => {
    const trigger = container.querySelector("button")!;
    trigger.focus();
    key(trigger, "ArrowDown");
    const links = container.querySelectorAll("nav a, nav button");
    expect(document.activeElement).toBe(links[0]);
    key(links[0], "End");
    expect(document.activeElement).toBe(links[links.length - 1]);
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(links[0]);
    key(links[0], "Escape");
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("dismisses outside and lets focus leave without trapping Tab", () => {
    const trigger = container.querySelector("button")!;
    click(trigger);
    act(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    key(trigger, "ArrowDown");
    const outside = document.createElement("button");
    document.body.append(outside);
    act(() => outside.focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("closes when an action is selected", () => {
    const trigger = container.querySelector("button")!;
    key(trigger, "ArrowDown");
    click(container.querySelector("nav button")!);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
