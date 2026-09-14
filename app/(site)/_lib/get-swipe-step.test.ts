import { describe, expect, it } from "vitest";

import { getSwipeStep } from "./get-swipe-step";

describe("getSwipeStep", () => {
  it("avança quando o dedo arrasta para a esquerda", () => {
    expect(getSwipeStep(-120, 10)).toBe(1);
  });

  it("volta quando o dedo arrasta para a direita", () => {
    expect(getSwipeStep(120, -10)).toBe(-1);
  });

  it("ignora gestos curtos (toque com o dedo tremendo)", () => {
    expect(getSwipeStep(-20, 0)).toBe(0);
    expect(getSwipeStep(20, 0)).toBe(0);
  });

  it("ignora gestos mais verticais que horizontais (scroll da página)", () => {
    expect(getSwipeStep(-60, 200)).toBe(0);
    expect(getSwipeStep(60, -60)).toBe(0);
  });
});
