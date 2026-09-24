"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { Pause, Play } from "lucide-react";

import {
  getBackVideoStyle,
  getBackVideoSyncTime,
  getLoopDistance,
} from "@/lib/cover-video-frame";
import { cn } from "@/lib/utils";
import { Seal } from "./seal";

type BookCoverProps = {
  title: string;
  /** Descrição da capa real — vira o rótulo acessível do card. */
  alt: string;
  size?: "sm" | "lg";
  className?: string;
  /** Preview em vídeo (mudo, loop, autoplay) — quando presente, substitui o placeholder. */
  videoSrc?: string;
  /** Ajusta o zoom do vídeo dentro do quadro. <1 reduz — usa em capas de
   *  caixa/estojo, cujo enquadramento original é mais largo que o dos livros
   *  e por isso lê como "maior" que os vizinhos quando preenche o quadro
   *  inteiro. >1 amplia — usa quando o enquadramento original deixa o livro
   *  pequeno no quadro em relação aos vizinhos. */
  videoScale?: number;
  /** Como o vídeo preenche o quadro. "cover" (padrão) recorta as bordas;
   *  "contain" nunca corta — usa quando a animação faz o objeto encostar na
   *  borda do próprio vídeo em algum ponto do loop (ver `coverVideoFit` em
   *  lib/data/schemas.ts). */
  videoFit?: "cover" | "contain";
  /** Mostra um botão glass de pausar/reproduzir sobre o vídeo. Só faz sentido
   *  no destaque grande do hero — nas miniaturas do catálogo/relacionados
   *  fica desligado por padrão. */
  showPauseControl?: boolean;
  /** Congela o vídeo no frame frontal e nunca toca — nem no hover, nem em
   *  autoplay. Usa onde a capa é só referência visual de um item numa lista
   *  (o que vem no kit, em combos-carousel.tsx), não o objeto em destaque. */
  still?: boolean;
  /** Mesmo giro de `videoSrc`, com a contracapa (ver `backVideoSrc` em
   *  lib/data/schemas.ts). Fica empilhado sobre a frente e aparece por
   *  `showBack` — quem decide quando virar é quem envolve o componente
   *  (book-cover-flip.tsx), não o BookCover. */
  backVideoSrc?: string;
  /** Mostra o verso em vez da frente. Só tem efeito com `backVideoSrc`. */
  showBack?: boolean;
  /** Realinha o verso à frente quando as duas passadas do render não saíram
   *  na mesma altura (ver `backVideoOffsetY` em lib/data/schemas.ts). Vale só
   *  para o vídeo do verso — a frente é a referência e não se mexe. */
  backVideoOffsetY?: number;
  /** Devolve o verso ao tamanho da frente quando as duas passadas do render
   *  não saíram com a câmera à mesma distância (ver `backVideoScale` em
   *  lib/data/schemas.ts). Também só para o vídeo do verso. */
  backVideoScale?: number;
  /** Desloca o verso dentro do loop quando o render dele gira para o lado
   *  contrário ao da frente (ver `backVideoPhase` em lib/data/schemas.ts).
   *  Em fração do loop: 0,5 é meia volta. */
  backVideoPhase?: number;
  /** Descrição da contracapa — substitui `alt` enquanto o verso está à
   *  mostra. Sem ela, o rótulo acessível continua descrevendo a frente. */
  backAlt?: string;
};

/** Métodos expostos por ref para iniciar/parar o vídeo no hover.
 *
 *  O BookCover nunca decide sozinho quando tocar: quem o envolve (o card, o
 *  carrossel de combos) é quem detecta o hover e chama isso. Não dá pra deixar
 *  o próprio BookCover escutar mouseenter/mouseleave no seu quadro — em cards
 *  com link esticado (`after:inset-0`, ver components/book-card.tsx) esse
 *  link fica por cima do vídeo na pilha de empilhamento e o quadro nunca
 *  chegaria a receber o evento; centralizar o controle aqui evita ter dois
 *  caminhos (um deles morto, dependendo de quem envolve o componente). */
export type BookCoverHandle = {
  play: () => void;
  pause: () => void;
};

// Frame mínimo (não 0) para o navegador decodificar e exibir uma imagem de
// repouso em vez de um retângulo preto quando o vídeo não está tocando.
const REST_FRAME_TIME = 0.01;

// Frame de repouso do modo `still`: o ponto do giro em que o livro encara a
// câmera de frente, com a capa inteira legível. Vale para todas as faixas de
// capa — todas saem do mesmo render de 200 frames a 24 fps (ver a skill
// `preparar-video-capa`), cuja pose frontal é o frame 53 (≈ 2,2 s). Os
// arquivos têm keyframe a cada 0,5 s, então o seek até aqui decodifica só os
// poucos frames depois de 2 s.
const FRONT_FRAME_TIME = 2.22;

// Um quadro dos renders de capa (24 fps): a folga abaixo da qual frente e
// verso já estão na mesma pose e não vale seek nenhum.
const FRAME_DURATION = 1 / 24;

// Teto de espera pelo seek que alinha as duas faces. Os arquivos têm keyframe
// a cada 0,5 s, então o seek normal resolve em bem menos que isso — o limite
// é só para a troca nunca ficar pendurada.
const SYNC_TIMEOUT_MS = 300;

/**
 * Capa do livro: vídeo de preview quando disponível, senão placeholder em CSS.
 *
 * Nem todo título ainda tem vídeo de capa enviado pela editora (ver
 * `coverVideoSrc` em lib/data/schemas.ts); nesses casos mantém o placeholder
 * (painel branco, moldura interna, selo) que já cobria a ausência de
 * qualquer asset de capa.
 *
 * Hover/foco dá um leve zoom (não desloca o card): o quadro externo fica fixo
 * e só o conteúdo interno escala, contido pelo `overflow-hidden`. Depende do
 * `group` do card pai (ver components/book-card.tsx).
 */
export const BookCover = forwardRef<BookCoverHandle, BookCoverProps>(function BookCover({
  title,
  alt,
  size = "sm",
  className,
  videoSrc,
  videoScale,
  videoFit = "cover",
  showPauseControl,
  still,
  backVideoSrc,
  showBack,
  backVideoOffsetY,
  backVideoScale,
  backVideoPhase,
  backAlt,
}, ref) {
  const isLarge = size === "lg";
  const videoRef = useRef<HTMLVideoElement>(null);
  const backVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasPauseControl = Boolean(videoSrc) && showPauseControl && !still;

  // A troca só acontece depois que o verso tem frame decodificado: cruzar a
  // opacidade antes disso mostraria o retângulo preto do vídeo ainda vazio no
  // primeiro clique (o arquivo do verso só começa a baixar aí — ver
  // book-cover-flip.tsx).
  const [isBackReady, setIsBackReady] = useState(false);
  // Quem manda na opacidade não é o `showBack` cru, e sim o efeito de sincronia
  // abaixo: a face nova só entra depois de alinhada com a que sai.
  const [isShowingBack, setIsShowingBack] = useState(false);

  // Miniaturas (catálogo, relacionados, estante) só tocam o vídeo no
  // hover/foco — dezenas delas com autoplay simultâneo é o que deixava essas
  // páginas pesadas. O destaque grande (showPauseControl) mantém o autoplay
  // contínuo de sempre, com o controle manual de pausar/reproduzir.
  const playsOnHover = Boolean(videoSrc) && !showPauseControl && !still;

  // Nos dois casos em que o vídeo não toca sozinho, ele precisa ser levado na
  // mão até um frame decodificável — senão fica no frame 0, que o navegador
  // mostra como retângulo preto/vazio.
  const restFrameTime = still ? FRONT_FRAME_TIME : REST_FRAME_TIME;
  const hasRestFrame = Boolean(videoSrc) && (playsOnHover || Boolean(still));

  // Frente e verso tocam empilhados enquanto os dois existem, então o controle
  // manual vale para os dois — senão virar a capa depois de pausar traria um
  // vídeo tocando de volta.
  function handleToggle() {
    const video = videoRef.current;
    if (!video) return;
    const shouldPlay = video.paused;
    for (const current of [video, backVideoRef.current]) {
      if (!current) continue;
      if (shouldPlay) {
        current.play();
      } else {
        current.pause();
      }
    }
  }

  function handleHoverStart() {
    if (!playsOnHover) return;
    videoRef.current?.play();
  }

  function handleHoverEnd() {
    if (!playsOnHover) return;
    // Só pausa — sem voltar o currentTime ao frame de repouso. Resetar aqui
    // fazia a capa "recomeçar" a cada hover, denunciando que é um vídeo; o
    // efeito 3D pretendido é a capa congelar exatamente onde o mouse saiu.
    videoRef.current?.pause();
  }

  function handleLoadedMetadata(event: SyntheticEvent<HTMLVideoElement>) {
    if (!hasRestFrame) return;
    event.currentTarget.currentTime = restFrameTime;
  }

  // Cobre o vídeo já em cache do navegador: nesse caso o evento nativo
  // `loadedmetadata` dispara assim que a tag é parseada, antes da hidratação
  // anexar `onLoadedMetadata` — o evento se perde e a capa trava no frame 0
  // (preto/em branco). No mount, se o readyState já indica metadata
  // carregado, aplica o frame de repouso direto, sem depender do evento.
  useEffect(() => {
    const video = videoRef.current;
    if (!hasRestFrame || !video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      video.currentTime = restFrameTime;
    }
  }, [hasRestFrame, restFrameTime]);

  // Frente e verso saem do mesmo render de 200 frames: no mesmo `currentTime`
  // o livro está na mesma pose do giro — ou meia volta adiante, nos títulos
  // que declaram `backVideoPhase` porque o verso foi rendido girando para o
  // outro lado. Só que cada
  // <video> toca por conta própria — e o do verso só é montado no primeiro
  // clique, começando do zero enquanto a frente já está em qualquer ponto do
  // loop de 8 s. Cruzar a opacidade assim trocava duas poses sem relação: o
  // livro saltava de ângulo no meio da virada em vez de trocar de face.
  //
  // Então, a cada troca, o vídeo que entra é levado ao tempo do que sai e a
  // opacidade só cruza depois do `seeked` — com o frame certo já decodificado,
  // não o keyframe anterior. O alinhamento que importa é o do primeiro
  // clique; depois dele os dois loops seguem juntos sozinhos (medido: 0,4 ms
  // de deriva em 3 s). Realinhar nos dois sentidos é garantia barata, já que
  // nada obriga dois <video> independentes a continuarem assim.
  useEffect(() => {
    const front = videoRef.current;
    const back = backVideoRef.current;
    if (!backVideoSrc || !front || !back || !isBackReady) return;

    const entering = showBack ? back : front;
    const leaving = showBack ? front : back;
    const reveal = () => setIsShowingBack(Boolean(showBack));
    const target = getBackVideoSyncTime(
      leaving.currentTime,
      entering.duration,
      backVideoPhase,
      Boolean(showBack),
    );

    // Menos de um quadro (1/24 s) de diferença já é a mesma pose na tela, e
    // seek nenhum: navegador não dispara `seeked` para um tempo que já é o
    // atual, e a troca ficaria esperando um evento que não vem.
    if (getLoopDistance(entering.currentTime, target, entering.duration) < FRAME_DURATION) {
      reveal();
      return;
    }

    entering.addEventListener("seeked", reveal, { once: true });
    // Rede de segurança para o seek que não completa (vídeo ainda enchendo o
    // buffer): virar com a pose desalinhada incomoda menos que um botão que
    // parece não fazer nada.
    const fallback = window.setTimeout(reveal, SYNC_TIMEOUT_MS);
    entering.currentTime = target;

    return () => {
      entering.removeEventListener("seeked", reveal);
      window.clearTimeout(fallback);
    };
  }, [backVideoPhase, backVideoSrc, isBackReady, showBack]);

  useImperativeHandle(ref, () => ({
    play: handleHoverStart,
    pause: handleHoverEnd,
  }));

  const frameStyle = videoScale ? { transform: `scale(${videoScale})` } : undefined;

  // Nas miniaturas com vídeo, sem folga extra o zoom de hover (scale-105
  // abaixo) empurra a capa para fora e corta o livro — em vez de parecer um
  // "3D" da capa, parece um vídeo cortado.
  //
  // A caixa de recorte (overflow-hidden) sangra 7% de largura para cada lado
  // além do card; o quadro interno (onde o `frameStyle` acima é aplicado)
  // fica recuado de volta ao tamanho original dentro dela — então o
  // enquadramento em repouso não muda, só ganha margem de manobra para o
  // hover não cortar o livro. O espaçamento maior do grid do catálogo
  // absorve essa sangria.
  const hasVideoBleed = Boolean(videoSrc) && !isLarge;
  const BLEED_PERCENT = 7;
  const frameInsetPercent = (BLEED_PERCENT / (100 + 2 * BLEED_PERCENT)) * 100;

  return (
    <div className={cn("group/cover relative aspect-3/4", className)}>
      <div
        role="img"
        aria-label={isShowingBack && backAlt ? backAlt : alt}
        className={cn(
          "absolute inset-y-0 overflow-hidden rounded-lg bg-white",
          hasVideoBleed ? "-inset-x-[7%]" : "inset-x-0",
        )}
      >
        <div
          className="absolute inset-y-0"
          style={{
            insetInlineStart: hasVideoBleed ? `${frameInsetPercent}%` : 0,
            insetInlineEnd: hasVideoBleed ? `${frameInsetPercent}%` : 0,
            ...frameStyle,
          }}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105 group-focus-within:scale-105">
            {videoSrc ? (
              <>
                <video
                  ref={videoRef}
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 size-full transition-opacity duration-500",
                    videoFit === "contain" ? "object-contain" : "object-cover",
                  )}
                  style={backVideoSrc ? { opacity: isShowingBack ? 0 : 1 } : undefined}
                  src={videoSrc}
                  autoPlay={!hasRestFrame}
                  loop={!still}
                  muted
                  playsInline
                  preload={hasRestFrame ? "metadata" : "auto"}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {backVideoSrc ? (
                  <video
                    ref={backVideoRef}
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 size-full transition-opacity duration-500",
                      videoFit === "contain" ? "object-contain" : "object-cover",
                    )}
                    style={getBackVideoStyle(
                      isShowingBack,
                      backVideoOffsetY,
                      backVideoScale,
                    )}
                    src={backVideoSrc}
                    // Monta já tocando só se a frente também estiver — o verso
                    // só entra na árvore depois do primeiro clique, e nesse
                    // ponto o usuário pode já ter pausado a capa.
                    autoPlay={!hasRestFrame && isPlaying}
                    loop={!still}
                    muted
                    playsInline
                    preload={hasRestFrame ? "metadata" : "auto"}
                    onLoadedMetadata={handleLoadedMetadata}
                    onLoadedData={() => setIsBackReady(true)}
                  />
                ) : null}
              </>
            ) : (
              <>
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute rounded border border-border",
                    isLarge ? "inset-5" : "inset-3",
                  )}
                />
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute flex items-center justify-center rounded-full bg-muted text-foreground/70",
                    isLarge ? "right-5 top-5 size-12" : "right-3 top-3 size-9",
                  )}
                >
                  <Seal className={isLarge ? "size-7" : "size-5"} />
                </div>

                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute font-display leading-tight text-foreground",
                    isLarge ? "inset-x-6 bottom-6 text-3xl" : "inset-x-4 bottom-4 text-lg",
                  )}
                >
                  {title}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {hasPauseControl ? (
        // Canto superior direito, não o centro do quadro: no centro o botão
        // caía em cima da ilustração da capa (o "P" de PLANT, no giro de
        // Mr. Plant) — no canto ele fica sobre a margem em volta do livro, sem
        // disputar espaço com o próprio objeto que está exibindo. O botão de
        // virar (book-cover-flip.tsx) mora no canto oposto, embaixo.
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
          className="absolute right-1 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/cover:opacity-80"
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </button>
      ) : null}
    </div>
  );
});
