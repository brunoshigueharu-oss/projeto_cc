import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GalleryLightbox } from "./gallery-lightbox";

vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => React.createElement("img", { src, alt }) }));

let host: HTMLDivElement;
let root: Root;
let thumbs: HTMLButtonElement[];
let reduced = false;
const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn(), finish: vi.fn() }));
const reveal = vi.fn();
const dismissed = vi.fn();

beforeEach(() => {
  Object.assign(globalThis, { React, IS_REACT_ACT_ENVIRONMENT: true });
  reduced = false;
  vi.stubGlobal("matchMedia", () => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.open = false; };
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  host = document.createElement("div");
  document.body.append(host);
  thumbs = [document.createElement("button"), document.createElement("button")];
  document.body.append(...thumbs);
  root = createRoot(host);
  document.body.style.overflow = "auto";
  document.body.style.paddingRight = "7px";
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  thumbs.forEach((button) => button.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function mount() {
  act(() => root.render(<GalleryLightbox images={[{ src: "/one.jpg", alt: "Primeira" }, { src: "/two.jpg", alt: "Segunda" }]} initialIndex={0} getThumbnail={(index) => thumbs[index]} revealThumbnail={reveal} onClose={dismissed} />));
}
function key(value: string, shiftKey = false) {
  act(() => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: value, shiftKey, bubbles: true })));
}

it("locks scrolling, cycles keyboard focus, and returns to the current image on Escape", async () => {
  mount();
  expect(document.body.style.overflow).toBe("hidden");
  const buttons = host.querySelectorAll("button");
  buttons[0].focus();
  key("Tab", true);
  expect(document.activeElement).toBe(buttons[2]);
  key("Tab");
  expect(document.activeElement).toBe(buttons[0]);
  key("ArrowRight");
  expect(host.querySelector("img")!.alt).toBe("Segunda");
  await act(async () => { host.querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true })); });
  expect(reveal).toHaveBeenCalledWith(1);
  expect(document.activeElement).toBe(thumbs[1]);
  expect(dismissed).toHaveBeenCalledOnce();
  expect(animate).toHaveBeenCalledTimes(2);
  act(() => root.render(null));
  expect(document.body.style.overflow).toBe("auto");
  expect(document.body.style.paddingRight).toBe("7px");
});

it("skips both animations when reduced motion is requested", async () => {
  reduced = true;
  mount();
  await act(async () => { host.querySelector("button")!.click(); });
  expect(animate).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(thumbs[0]);
  expect(dismissed).toHaveBeenCalledOnce();
});
