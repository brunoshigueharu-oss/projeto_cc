/** Distância horizontal mínima (px) para um arrasto contar como swipe. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * Converte o deslocamento de um gesto de toque em passo do carrossel:
 * arrastar para a esquerda avança (`1`), para a direita volta (`-1`).
 * Gesto curto (toque) ou mais vertical que horizontal (scroll da página)
 * não conta (`0`).
 */
export function getSwipeStep(deltaX: number, deltaY: number): -1 | 0 | 1 {
  const distanceX = Math.abs(deltaX);
  if (distanceX < SWIPE_THRESHOLD_PX || distanceX <= Math.abs(deltaY)) return 0;
  return deltaX < 0 ? 1 : -1;
}
