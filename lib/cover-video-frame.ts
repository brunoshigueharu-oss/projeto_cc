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
 * quando o título declara `backVideoOffsetY`/`backVideoScale`, o
 * deslocamento e o redimensionamento que realinham o render do verso ao da
 * frente.
 *
 * O deslocamento é em % da altura do elemento, que com `object-cover` é a
 * altura do próprio vídeo — o recorte deste formato é lateral, não vertical
 * (vídeo 992×1216 num quadro 3:4). Com `object-contain` sobraria moldura em
 * cima e embaixo e a conta deixaria de bater, então remedir o valor se algum
 * título passar a combinar os dois.
 *
 * A ordem importa: `translateY` vem antes do `scale` para o offset continuar
 * valendo em % do quadro em tamanho original. Invertida, o deslocamento
 * medido na tela passaria a ser multiplicado pela escala e os títulos que
 * usam os dois campos precisariam de valores diferentes dos que usam só um.
 */
export function getBackVideoStyle(
  isShowingBack: boolean,
  offsetY?: number,
  scale?: number,
): BackVideoStyle {
  const transform = [
    // `0` cai fora aqui junto com `undefined`: criar um transform que não move
    // nada só promoveria o vídeo a uma camada de composição à toa. Pelo mesmo
    // motivo a escala neutra (1) também não entra.
    ...(offsetY ? [`translateY(${offsetY}%)`] : []),
    ...(scale && scale !== 1 ? [`scale(${scale})`] : []),
  ].join(" ");

  return {
    opacity: isShowingBack ? 1 : 0,
    ...(transform ? { transform } : {}),
  };
}

/**
 * Menor distância entre dois pontos do loop, medida também pela emenda: com o
 * vídeo em 8,32 s e o alvo em 0,01 s a distância é de dois quadros, não de
 * quase o loop inteiro.
 */
export function getLoopDistance(a: number, b: number, duration: number): number {
  const direta = Math.abs(a - b);
  if (!(duration > 0)) return direta;
  const resto = direta % duration;
  return Math.min(resto, duration - resto);
}

/**
 * Em que ponto do loop pôr o vídeo que entra para ele casar com o que sai.
 *
 * Normalmente é o mesmo instante: os dois renders de um título saem da mesma
 * passada e giram juntos. A exceção é o par cujo verso foi rendido como
 * segunda capa em vez de contracapa — ali o fornecedor espelhou a cena, o
 * livro gira para o lado contrário e casar os dois no mesmo instante faz a
 * troca inverter o sentido do giro, como um vai e vem. Como a animação é uma
 * oscilação simétrica, meia volta de loop (`phase: 0.5`) devolve o mesmo
 * ângulo andando para o mesmo lado (ver `backVideoPhase` em
 * lib/data/schemas.ts).
 *
 * `toBack` inverte o sinal na volta, para a frente voltar de onde saiu.
 */
export function getBackVideoSyncTime(
  leavingTime: number,
  duration: number,
  phase: number | undefined,
  toBack: boolean,
): number {
  if (!phase || !(duration > 0)) return leavingTime;
  const deslocado = leavingTime + phase * duration * (toBack ? 1 : -1);
  return ((deslocado % duration) + duration) % duration;
}
