/** Enquadramento do vídeo de contracapa dentro do quadro da capa.
 *
 *  Mora fora do componente porque é a regra que o bug do verso cortado
 *  quebrou (ver `backVideoOffsetY` em lib/data/schemas.ts) e aqui ela fica
 *  testável sem montar o BookCover.
 */

type BackVideoStyle = {
  opacity: number;
  transform?: string;
};

/**
 * Style do `<video>` do verso: a opacidade que faz a troca com a frente e,
 * quando o título declara `backVideoOffsetY`, o deslocamento vertical que
 * realinha o render do verso ao da frente.
 *
 * O deslocamento é em % da altura do elemento, que com `object-cover` é a
 * altura do próprio vídeo — o recorte deste formato é lateral, não vertical
 * (vídeo 992×1216 num quadro 3:4). Com `object-contain` sobraria moldura em
 * cima e embaixo e a conta deixaria de bater, então remedir o valor se algum
 * título passar a combinar os dois.
 */
export function getBackVideoStyle(
  isShowingBack: boolean,
  offsetY?: number,
): BackVideoStyle {
  return {
    opacity: isShowingBack ? 1 : 0,
    // `0` cai aqui junto com `undefined`: criar um transform que não move
    // nada só promoveria o vídeo a uma camada de composição à toa.
    ...(offsetY ? { transform: `translateY(${offsetY}%)` } : {}),
  };
}
