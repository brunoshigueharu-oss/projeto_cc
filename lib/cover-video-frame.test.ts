import { describe, expect, it } from "vitest";

import {
  getBackVideoStyle,
  getBackVideoSyncTime,
  getLoopDistance,
} from "./cover-video-frame";

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

describe("getBackVideoStyle — escala do verso", () => {
  it("amplia o verso quando o render dele saiu menor que o da frente", () => {
    expect(getBackVideoStyle(true, undefined, 1.045)).toEqual({
      opacity: 1,
      transform: "scale(1.045)",
    });
  });

  it("reduz o verso quando o render dele saiu maior que o da frente", () => {
    expect(getBackVideoStyle(true, undefined, 0.957)).toEqual({
      opacity: 1,
      transform: "scale(0.957)",
    });
  });

  it("desloca antes de escalar, para o offset seguir valendo em % do quadro", () => {
    expect(getBackVideoStyle(true, -11.3, 1.045)).toEqual({
      opacity: 1,
      transform: "translateY(-11.3%) scale(1.045)",
    });
  });

  it("não cria transform para a escala neutra", () => {
    expect(getBackVideoStyle(true, 0, 1)).toEqual({ opacity: 1 });
  });

  it("mantém a escala enquanto o verso está escondido, para não animar o tamanho na troca", () => {
    expect(getBackVideoStyle(false, undefined, 1.045)).toEqual({
      opacity: 0,
      transform: "scale(1.045)",
    });
  });
});

describe("getBackVideoSyncTime", () => {
  const DUR = 8.333; // loop de 200 frames a 24 fps

  it("casa o verso no mesmo ponto do loop quando os dois renders giram junto", () => {
    expect(getBackVideoSyncTime(3.2, DUR, undefined, true)).toBe(3.2);
    expect(getBackVideoSyncTime(3.2, DUR, 0, false)).toBe(3.2);
  });

  it("adianta o verso meia volta quando o render dele gira ao contrário", () => {
    expect(getBackVideoSyncTime(1, DUR, 0.5, true)).toBeCloseTo(1 + DUR / 2, 5);
  });

  it("dá a volta no loop em vez de passar do fim do vídeo", () => {
    expect(getBackVideoSyncTime(7, DUR, 0.5, true)).toBeCloseTo(7 + DUR / 2 - DUR, 5);
  });

  it("desfaz o mesmo deslocamento na volta para a frente", () => {
    const noVerso = getBackVideoSyncTime(1, DUR, 0.5, true);
    expect(getBackVideoSyncTime(noVerso, DUR, 0.5, false)).toBeCloseTo(1, 5);
  });

  it("não inventa deslocamento enquanto o vídeo não sabe a própria duração", () => {
    expect(getBackVideoSyncTime(2, NaN, 0.5, true)).toBe(2);
    expect(getBackVideoSyncTime(2, 0, 0.5, true)).toBe(2);
  });
});

describe("getLoopDistance", () => {
  it("mede pelo caminho mais curto, inclusive passando pela emenda do loop", () => {
    expect(getLoopDistance(0.01, 8.32, 8.333)).toBeCloseTo(0.023, 3);
    expect(getLoopDistance(1, 3, 8.333)).toBe(2);
  });

  it("cai na diferença simples quando a duração ainda não é conhecida", () => {
    expect(getLoopDistance(1, 3, NaN)).toBe(2);
  });
});
