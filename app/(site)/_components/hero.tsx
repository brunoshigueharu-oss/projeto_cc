"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeBanner } from "@/lib/data/schemas";
import { getSwipeStep } from "../_lib/get-swipe-step";
import { HeroBannerVideo } from "./hero-banner-video";

const CAROUSEL_ARROW_CLASSNAME =
  "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-white/8 text-white backdrop-blur-[10px] transition-colors hover:bg-white/16 lg:size-11";

/** Tempo de cada banner na tela antes de o carrossel avançar sozinho. */
const AUTOPLAY_DELAY_MS = 3000;

/** Quanto dura o deslize de um banner para o outro. É o mesmo
 * `duration-[600ms]` do slide em `hero-banner-video.tsx`; aqui serve só para
 * saber quando o banner que saiu já pode ser desmontado. */
const SLIDE_TRANSITION_MS = 600;

/** Sentido do deslize: `1` traz o próximo pela direita (o mesmo movimento do
 * avanço automático), `-1` traz o anterior pela esquerda. */
type Direction = -1 | 1;

type HeroProps = {
  banners: readonly HomeBanner[];
};

/**
 * Hero da Home = carrossel de vídeos em faixa cheia (mudo/loop/autoplay),
 * sem texto sobreposto. Cada vídeo é um link para o destino do banner
 * (página do livro ou `/campanhas`). Anda sozinho a cada 3s e também por
 * setas, bolinhas ou swipe (toque) — em todos os casos o banner novo entra
 * deslizando pela borda.
 */
export function Hero({ banners }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [entering, setEntering] = useState<{ index: number; direction: Direction } | null>(null);
  const [leaving, setLeaving] = useState<{ index: number; direction: Direction } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);
  const hasSwiped = useRef(false);
  const total = banners.length;

  const goTo = useCallback(
    (index: number, direction: Direction) => {
      const target = (index + total) % total;
      if (target === activeIndex) return;

      // O banner vizinho já está montado encostado na borda: trocar quem é o
      // ativo basta, porque os dois mudam de posição e o CSS faz o deslize.
      const isNeighbor =
        target === (activeIndex + 1) % total || target === (activeIndex - 1 + total) % total;
      if (isNeighbor && hasStarted) {
        setActiveIndex(target);
        return;
      }

      // Pulo de bolinha (ou antes de o primeiro vídeo rodar, quando ainda não
      // há vizinhos montados): o destino nasce parado na borda e só vira o
      // ativo no frame seguinte — senão apareceria direto no lugar, sem
      // deslize nenhum, porque não existiria posição anterior para animar.
      setEntering({ index: target, direction });
    },
    [activeIndex, hasStarted, total]
  );

  useEffect(() => {
    if (!entering) return;

    // Dois frames: o primeiro pinta o banner novo na borda, o segundo o põe
    // em cena. Um só não bastaria — o navegador ainda não teria desenhado a
    // posição de partida.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        setLeaving({ index: activeIndex, direction: entering.direction });
        setActiveIndex(entering.index);
        setEntering(null);
      });
    });

    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [activeIndex, entering]);

  // Quem saiu num pulo de bolinha não é vizinho de ninguém, então só continua
  // montado enquanto desliza para fora.
  useEffect(() => {
    if (!leaving) return;

    const timer = window.setTimeout(() => setLeaving(null), SLIDE_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // Avanço automático. O efeito roda de novo a cada troca de banner, então
  // navegar na mão (setas, bolinhas ou swipe) reinicia a contagem em vez de
  // deixar o slide recém-escolhido sair no meio do tempo do anterior.
  useEffect(() => {
    if (total < 2) return;
    // Mesma regra do resto do site (ver `lazy-video.tsx`): quem pediu menos
    // movimento no sistema troca de banner só pelas setas e bolinhas. O
    // deslize em si já morre no `prefers-reduced-motion` de `globals.css`.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => goTo(activeIndex + 1, 1), AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, goTo, total]);

  if (total === 0) return null;

  const banner = banners[activeIndex];
  const hasMultipleBanners = total > 1;

  // Janela de slides montados: o da vez em cena e os dois vizinhos, parados
  // nas bordas e já carregados, para o deslize nunca começar num quadro
  // preto. Map por índice para um banner não entrar duas vezes num carrossel
  // curto, e ordenado por índice para os <video> não trocarem de lugar no
  // DOM entre renders — mover um vídeo no DOM o faz pausar em alguns
  // navegadores.
  const slideOffsets = new Map<number, number>();
  if (hasMultipleBanners && hasStarted) {
    slideOffsets.set((activeIndex - 1 + total) % total, -1);
    slideOffsets.set((activeIndex + 1) % total, 1);
  }
  if (leaving) slideOffsets.set(leaving.index, -leaving.direction);
  slideOffsets.set(activeIndex, 0);
  if (entering) slideOffsets.set(entering.index, entering.direction);
  const slides = [...slideOffsets].sort(([a], [b]) => a - b);

  // Swipe só para toque/caneta — mouse já tem as setas. Sem
  // `setPointerCapture` de propósito: capturar o ponteiro desvia o "click"
  // do toque para o elemento que capturou, e o Link deixa de navegar (ver
  // `book-gallery.tsx`).
  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>) {
    // Zera para qualquer ponteiro: num aparelho híbrido, um clique de mouse
    // depois de um swipe por toque não pode herdar o bloqueio do swipe.
    hasSwiped.current = false;
    if (event.pointerType === "mouse") return;
    swipeOrigin.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLAnchorElement>) {
    const origin = swipeOrigin.current;
    swipeOrigin.current = null;
    if (!origin || !hasMultipleBanners) return;

    const step = getSwipeStep(event.clientX - origin.x, event.clientY - origin.y);
    if (step === 0) return;

    hasSwiped.current = true;
    goTo(activeIndex + step, step);
  }

  function handlePointerCancel() {
    // O navegador assumiu o gesto (scroll vertical da página).
    swipeOrigin.current = null;
  }

  function handleClickCapture(event: MouseEvent<HTMLAnchorElement>) {
    // Swipe de verdade não deve abrir a página do livro. `detail === 0` é
    // clique de teclado (Enter) — nunca vem de um swipe, então não bloqueia.
    if (hasSwiped.current && event.detail > 0) {
      event.preventDefault();
      hasSwiped.current = false;
    }
  }

  return (
    <section className="relative overflow-hidden bg-background">
      {/* `touch-pan-y`: o navegador só assume o arrasto vertical (scroll da
          página); o horizontal chega aos handlers como swipe. */}
      <Link
        href={banner.href}
        aria-label={`Ver ${banner.label}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        className="relative block aspect-square w-full touch-pan-y touch-pinch-zoom sm:aspect-[1785/650]"
      >
        {slides.map(([index, offset]) => (
          <HeroBannerVideo
            key={banners[index].slug}
            banner={banners[index]}
            offset={offset}
            isActive={index === activeIndex}
            onPlaying={() => setHasStarted(true)}
          />
        ))}
      </Link>

      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(activeIndex - 1, -1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "left-3 lg:left-10")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => goTo(activeIndex + 1, 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "right-3 lg:right-10")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          {/* Cada bolinha é um botão de 24px de altura com a pílula de 6px
              centralizada: a pílula continua pequena, mas o alvo de toque
              não. Com alvo de 6px, errar por poucos pixels caía no Link do
              vídeo e abria a página do livro. */}
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
            {banners.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ir para banner ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index, index > activeIndex ? 1 : -1)}
                className="group flex h-6 items-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1.5 rounded-full bg-white/30 transition-all",
                    index === activeIndex ? "w-6 bg-primary" : "w-1.5 group-hover:bg-white/50"
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
