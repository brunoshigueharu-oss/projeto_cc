import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookSynopsis } from "./book-synopsis";

let container: HTMLDivElement;
let root: Root;
let resize: () => void;
let fullHeight: number;
let viewportTop: number;
let reducedMotion: boolean;

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  fullHeight = 300;
  viewportTop = 100;
  reducedMotion = true;
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(window, "getComputedStyle").mockReturnValue({ lineHeight: "24px" } as CSSStyleDeclaration);
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reducedMotion; } }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const height = this.tagName === "P" ? fullHeight : parseFloat(this.style.height) || 0;
    const top = this.tagName === "BUTTON"
      ? viewportTop + parseFloat((this.previousElementSibling as HTMLElement).style.height) + 8
      : viewportTop;
    return { top, height, bottom: top + height, left: 0, right: 500, width: 500, x: 0, y: top, toJSON() {} };
  });
  vi.spyOn(window, "scrollBy").mockImplementation((options) => {
    viewportTop -= (options as ScrollToOptions).top ?? 0;
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function render(text = "A long synopsis") {
  act(() => root.render(<BookSynopsis text={text} />));
}
function toggle() {
  act(() => container.querySelector("button")!.click());
}
function viewport() {
  return container.querySelector("p")!.parentElement!;
}

describe("BookSynopsis", () => {
  it("recalculates overflow on resize while collapsed and expanded, and on new content", () => {
    fullHeight = 72;
    render();
    expect(container.querySelector("button")).toBeNull();
    fullHeight = 300;
    act(() => resize());
    expect(container.querySelector("button")!.textContent).toBe("Leia mais");
    toggle();
    fullHeight = 400;
    act(() => resize());
    expect(viewport().style.height).toBe("400px");
    expect(container.querySelector("button")!.textContent).toBe("Leia menos");
    fullHeight = 48;
    render("Short replacement");
    expect(container.querySelector("button")).toBeNull();
    expect(viewport().style.height).toBe("48px");
  });

  it("exposes the controlled text and skips animation for reduced motion", () => {
    const request = vi.spyOn(window, "requestAnimationFrame");
    render();
    const button = container.querySelector("button")!;
    expect(button.getAttribute("aria-controls")).toBe(container.querySelector("p")!.id);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    toggle();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(viewport().style.height).toBe("300px");
    expect(request).not.toHaveBeenCalled();
  });

  it("keeps the collapse control in place when the start of the synopsis is offscreen", () => {
    render();
    toggle();
    viewportTop = -150;
    const before = container.querySelector("button")!.getBoundingClientRect().top;
    toggle();
    expect(viewport().style.height).toBe("96px");
    expect(container.querySelector("button")!.getBoundingClientRect().top).toBe(before);
    expect(window.scrollBy).toHaveBeenCalledWith({ top: -204, behavior: "instant" });
  });

  it("animates briefly and respects a reduced-motion change mid-animation", () => {
    reducedMotion = false;
    let frame: FrameRequestCallback = () => {};
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { frame = callback; return 1; });
    render();
    toggle();
    expect(viewport().style.height).toBe("96px");
    reducedMotion = true;
    act(() => frame(performance.now()));
    expect(viewport().style.height).toBe("300px");
  });
});
