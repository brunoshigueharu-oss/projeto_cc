import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";

import type { HomeBanner } from "@/lib/data/schemas";
import { Hero } from "./hero";

const BANNERS: HomeBanner[] = ["um", "dois", "tres"].map((slug) => ({
  slug,
  videoSrc: `/videos/${slug}.mp4`,
  href: `/catalogo/${slug}`,
  label: slug,
}));

const AUTOPLAY_MS = 5000;
/** Folga para os dois `requestAnimationFrame` que põem o banner novo em cena. */
const FRAMES_MS = 100;

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let reducedMotion: EventTarget & { matches: boolean };
let play: ReturnType<typeof vi.fn>;
let pause: ReturnType<typeof vi.fn>;

const activeBanner = () => container.querySelector("a")!.getAttribute("aria-label");
const button = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

async function tick(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await act(async () => {
    vi.advanceTimersByTime(FRAMES_MS);
  });
}

async function mount() {
  root = createRoot(container);
  await act(async () => root.render(<Hero banners={BANNERS} />));
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  reducedMotion = Object.assign(new EventTarget(), { matches: false });
  const otherQuery = Object.assign(new EventTarget(), { matches: false });
  window.matchMedia = vi.fn((query: string) =>
    query.includes("prefers-reduced-motion") ? reducedMotion : otherQuery,
  ) as unknown as typeof window.matchMedia;
  play = vi.fn(async () => {});
  pause = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as () => Promise<void>);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause as () => void);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Hero", () => {
  it("avança sozinho e toca o vídeo quando nada o segura", async () => {
    await mount();
    expect(play).toHaveBeenCalled();
    expect(activeBanner()).toBe("Ver um");

    await tick(AUTOPLAY_MS);
    expect(activeBanner()).toBe("Ver dois");
  });

  it("não troca o destino enquanto o foco do teclado está no carrossel", async () => {
    await mount();
    const link = container.querySelector("a")!;
    // O jsdom não implementa `:focus-visible`; num navegador, foco vindo do
    // teclado (Tab) casa com o seletor e foco de clique de mouse não.
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
      return selector === ":focus-visible" ? this === document.activeElement : matches.call(this, selector);
    });
    await act(async () => link.focus());

    await tick(AUTOPLAY_MS * 4);
    expect(activeBanner()).toBe("Ver um");

    await act(async () => link.blur());
    await tick(AUTOPLAY_MS);
    expect(activeBanner()).toBe("Ver dois");
  });

  it("não troca o destino enquanto o mouse está sobre o banner", async () => {
    await mount();
    const section = container.querySelector("section")!;
    // React deriva `onPointerEnter`/`Leave` de `pointerover`/`pointerout`.
    const pointer = (type: string, relatedTarget: Element | null) =>
      Object.assign(new MouseEvent(type, { bubbles: true, relatedTarget }), { pointerType: "mouse" });
    await act(async () => section.dispatchEvent(pointer("pointerover", document.body)));

    await tick(AUTOPLAY_MS * 4);
    expect(activeBanner()).toBe("Ver um");

    await act(async () => section.dispatchEvent(pointer("pointerout", document.body)));
    await tick(AUTOPLAY_MS);
    expect(activeBanner()).toBe("Ver dois");
  });

  it("com movimento reduzido toca e avança do mesmo jeito", async () => {
    reducedMotion.matches = true;
    await mount();

    expect(play).toHaveBeenCalled();
    await tick(AUTOPLAY_MS);
    expect(activeBanner()).toBe("Ver dois");
  });

  it("não tem botão de pausa", async () => {
    await mount();
    expect(button("Pausar banners")).toBeNull();
  });
});
