import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Page from "./page";
import { CartProvider } from "@/lib/cart/cart-context";
import { COMBOS } from "@/lib/data/combos";
import { BOOKS_BY_SLUG } from "@/lib/data/books";
const key = "hocus-pocus:cart";
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
const slugs = [...BOOKS_BY_SLUG.keys()].slice(0, 2);
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); localStorage.clear(); });
async function mount(lines: unknown[]) {
  localStorage.setItem(key, JSON.stringify(lines));
  await act(() => root.render(<CartProvider><Page /></CartProvider>));
}
async function click(label: string) {
  const button = container.querySelector<HTMLButtonElement>(`button[aria-label^="${label}"]`)!;
  expect(button).toBeTruthy();
  await act(() => button.click());
}
describe("cart undo", () => {
  it("keeps undo in empty state and restores original quantity only once", async () => {
    const line = { type: "book", slug: slugs[0], quantity: 3 };
    await mount([line]);
    await click("Remover");
    expect(container.textContent).toContain("Seu carrinho está vazio");
    const undo = container.querySelector<HTMLButtonElement>('button[aria-label^="Desfazer"]')!;
    await act(() => { undo.click(); undo.click(); });
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([line]);
  });
  it("undoes consecutive removals independently", async () => {
    const lines = slugs.map((slug, i) => ({ type: "book", slug, quantity: i + 2 }));
    await mount(lines);
    await click("Remover"); await click("Remover");
    expect(container.querySelectorAll('button[aria-label^="Desfazer"]')).toHaveLength(2);
    await click("Desfazer"); await click("Desfazer");
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(lines);
  });
  it("merges into an existing same identity without duplicating a line", async () => {
    const line = { type: "book", slug: slugs[0], quantity: 3 };
    await mount([line]); await click("Remover");
    localStorage.setItem(key, JSON.stringify([{ ...line, quantity: 2 }]));
    await act(() => window.dispatchEvent(new Event("storage")));
    await click("Desfazer");
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([{ ...line, quantity: 5 }]);
  });
});

it("restores a combo with its original identity", async () => {
  const line = { type: "combo", slug: COMBOS[0].slug, quantity: 2 };
  await mount([line]);
  await click("Remover");
  await click("Desfazer");
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([line]);
});

it("finishes the exit when reduced motion is enabled mid-animation", async () => {
  let resolve!: () => void;
  const finished = new Promise<void>((done) => { resolve = done; });
  const finish = vi.fn(resolve);
  const media = Object.assign(new EventTarget(), { matches: false });
  window.matchMedia = vi.fn().mockReturnValue(media);
  const line = { type: "book", slug: slugs[0], quantity: 2 };
  await mount([line]);
  const row = container.querySelector("li")!;
  const animate = vi.fn().mockReturnValue({ finished, finish });
  row.animate = animate;
  await click("Remover");
  expect(animate).toHaveBeenCalledOnce();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([line]);
  await act(() => {
    media.matches = true;
    media.dispatchEvent(new Event("change"));
  });
  expect(finish).toHaveBeenCalledOnce();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
  await click("Desfazer");
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([line]);
});
