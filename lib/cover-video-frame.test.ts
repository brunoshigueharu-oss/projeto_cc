import { describe, expect, it } from "vitest";

import { getBackVideoStyle } from "./cover-video-frame";

describe("getBackVideoStyle", () => {
  it("mostra o verso só quando showBack está ligado", () => {
    expect(getBackVideoStyle(true).opacity).toBe(1);
    expect(getBackVideoStyle(false).opacity).toBe(0);
  });

  it("sobe o verso quando o título declara o desencontro com a frente", () => {
    expect(getBackVideoStyle(true, -11.3)).toEqual({
      opacity: 1,
      transform: "translateY(-11.3%)",
    });
  });

  it("não mexe no verso dos títulos cujo render já bate com a frente", () => {
    expect(getBackVideoStyle(true)).toEqual({ opacity: 1 });
    expect(getBackVideoStyle(true, 0)).toEqual({ opacity: 1 });
  });

  it("mantém o deslocamento enquanto o verso está escondido, para não animar a posição na troca", () => {
    expect(getBackVideoStyle(false, -11.3)).toEqual({
      opacity: 0,
      transform: "translateY(-11.3%)",
    });
  });
});
