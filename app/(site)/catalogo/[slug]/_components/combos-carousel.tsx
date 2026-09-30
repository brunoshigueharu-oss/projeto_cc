"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Truck } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCover } from "@/components/book-cover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import type { Book, Combo } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

/**
 * Preço já formatado por `combos-section.tsx` (Server Component): `formatPrice`
 * é `server-only` e não pode ser chamado daqui, que é Client Component.
 */
export type CombosCarouselItem = {
  combo: Combo;
  books: readonly Book[];
  formattedPrice: string;
  /** `null` quando o combo não tem preço "de" (sem `originalPrice`). */
  formattedOriginalPrice: string | null;
  /** Faixas dos livros do kit, na ordem de `combo.bookSlugs` e sem repetidas
   *  (ver `combos-section.tsx`). O palco roda entre elas; vazio quando
   *  nenhum livro do kit tem faixa. */
  videoSrcs: readonly string[];
};

type CombosCarouselProps = {
  combos: readonly CombosCarouselItem[];
};

/** Quanto tempo um combo sem faixa (ou com reduced-motion) fica em cena
 *  antes de o carousel passar para o próximo. */
const COMBO_STATIC_SLIDE_MS = 5000;

/**
 * Único ponto com JS de cliente da seção de combos — precisa do embla
 * (`components/ui/carousel.tsx`) pra rodar o avanço automático e as setas. O
 * resto da página de livro renderiza no servidor, mesma exceção já
 * documentada em `parallax-section.tsx`.
 *
 * Sem o plugin de autoplay do embla: com delay fixo ele trocava de combo no
 * meio de uma faixa. Quem pede o próximo slide é o próprio banner, quando a
 * última faixa do kit termina (ver `ComboVideoRotator`).
 */
export function CombosCarousel({ combos }: CombosCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setSelectedIndex(api.selectedScrollSnap());
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Combo sem nenhuma faixa no kit não tem `ended` pra esperar: fica em cena
  // o tempo de um slide comum.
  const hasSelectedVideos = (combos[selectedIndex]?.videoSrcs.length ?? 0) > 0;
  useEffect(() => {
    if (!api || hasSelectedVideos || combos.length < 2) return;

    const timer = setTimeout(() => api.scrollNext(), COMBO_STATIC_SLIDE_MS);
    return () => clearTimeout(timer);
  }, [api, selectedIndex, hasSelectedVideos, combos.length]);

  // Só o slide em cena avança o carousel: um banner que ainda estivesse
  // terminando uma faixa fora de vista não pode arrastar o slide atual.
  const handleBannerFinished = (index: number) => {
    if (!api || api.selectedScrollSnap() !== index) return;
    api.scrollNext();
  };

  return (
    <Carousel
      opts={{ loop: combos.length > 1 }}
      setApi={setApi}
      className="w-full"
    >
      <CarouselContent>
        {combos.map((item, index) => (
          <CarouselItem key={item.combo.slug}>
            <ComboBanner
              item={item}
              onFinished={() => handleBannerFinished(index)}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {combos.length > 1 ? (
        <>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </>
      ) : null}
    </Carousel>
  );
}

/**
 * Banner em duas colunas: a faixa de vídeo com o nome do combo por cima à
 * esquerda e o painel branco da oferta (o que vem no kit, preço e CTA) à
 * direita — empilha no mobile, vídeo primeiro.
 */
function ComboBanner({
  item,
  onFinished,
}: {
  item: CombosCarouselItem;
  onFinished: () => void;
}) {
  const { combo, books, formattedPrice, formattedOriginalPrice, videoSrcs } = item;

  return (
    // Fundo da seção e painel da oferta são os dois brancos, então quem
    // recorta o banner é a `border-border` bege — o `ring-foreground/10` do
    // padrão de Card é escuro demais pra ficar rente ao vídeo e claro demais
    // pra segurar o painel, e some contra o branco da seção.
    <div className="grid overflow-hidden rounded-[28px] border border-border shadow-lg shadow-foreground/10 lg:grid-cols-[3fr_2fr]">
      <ComboStage combo={combo} videoSrcs={videoSrcs} onFinished={onFinished} />
      <ComboOffer
        combo={combo}
        books={books}
        formattedPrice={formattedPrice}
        formattedOriginalPrice={formattedOriginalPrice}
      />
    </div>
  );
}

/**
 * Painel da esquerda: as faixas de vídeo dos livros DO KIT em loop (mudas,
 * como as demais faixas do site — ver `video-banner.tsx`), uma de cada vez,
 * escurecidas por um degradê para o nome do combo em branco ficar legível em
 * qualquer frame.
 *
 * Sem nenhuma faixa no kit, cai na arte dedicada do combo (`combo.image`) e,
 * sem ela, no marrom sólido — o título branco funciona nos três casos.
 */
function ComboStage({
  combo,
  videoSrcs,
  onFinished,
}: {
  combo: Combo;
  videoSrcs: readonly string[];
  onFinished: () => void;
}) {
  return (
    // No mobile a altura é só dessa faixa (o painel vem embaixo), e o título
    // de combo mais longo ocupa três linhas — daí o piso mais alto que o
    // `min-h-64` que bastaria para o vídeo sozinho.
    <div className="relative min-h-72 overflow-hidden bg-primary sm:min-h-80 lg:min-h-[26rem]">
      {videoSrcs.length > 0 ? (
        <ComboVideoRotator srcs={videoSrcs} onFinished={onFinished} />
      ) : combo.image ? (
        <Image
          src={combo.image.src}
          alt={combo.image.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 690px, 100vw"
        />
      ) : null}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-foreground/85 via-foreground/30 to-foreground/5"
      />

      <h3 className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl leading-tight font-bold text-balance text-white sm:p-8 sm:text-3xl lg:text-4xl">
        {combo.title}
      </h3>
    </div>
  );
}

/**
 * Faixas do kit em sequência: cada uma toca inteira, do começo ao fim, e só
 * então entra a próxima com crossfade — o banner apresenta todos os livros da
 * oferta sem cortar nenhum close-up no meio. Ao fim da última, avisa
 * `onFinished` (o carousel passa para o próximo combo) e recomeça da primeira.
 *
 * Sem faixas para tocar (reduced-motion), o banner fica parado na primeira e
 * avisa `onFinished` depois de `COMBO_STATIC_SLIDE_MS`, como um slide comum.
 *
 * Não usa `LazyVideo` porque aqui há vários `<video>` na mesma posição: o
 * observer daquele componente veria todos como visíveis e mandaria tocar
 * todos juntos — exatamente a decodificação em paralelo que ele existe para
 * evitar. A mesma ideia continua valendo, só que coordenada por um observer
 * só: o `src` de um vídeo só entra no DOM na vez dele (e na do anterior, pra
 * dar tempo de bufferizar), e fora da tela tudo pausa. São 4,5 MB por faixa,
 * então baixar as quatro de um combo de uma vez custaria caro.
 */
function ComboVideoRotator({
  srcs,
  onFinished,
}: {
  srcs: readonly string[];
  onFinished: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [isInView, setIsInView] = useState(false);
  // Fica `true` na primeira vez que o banner aparece e não volta atrás:
  // tirar o `src` de um vídeo que saiu da tela descartaria o buffer de uma
  // faixa que vai reaparecer na próxima volta do rodízio.
  const [hasAppeared, setHasAppeared] = useState(false);
  // Quantas trocas já aconteceram, não o índice: é o contador que diz quais
  // faixas já foram (ou estão prestes a ser) pedidas — ver `isLoaded`.
  const [step, setStep] = useState(0);

  const activeIndex = step % srcs.length;

  // A faixa da vez e a seguinte: o `src` do próximo entra com um ciclo de
  // antecedência para ele já estar bufferizado na hora da troca. Depois de
  // uma volta completa, `step` já passou de todos os índices e nenhum vídeo
  // volta a ser descarregado.
  const isLoaded = (index: number) => hasAppeared && index <= step + 1;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Sem suporte a IntersectionObserver, o comportamento certo é o antigo
    // (carrega e toca), nunca um banner parado no fundo marrom.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => {
        setIsInView(true);
        setHasAppeared(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    // Os slides parados do embla ficam fora do `overflow-hidden` do
    // carousel, então o observer já devolve `false` pra eles — é isso que
    // impede o combo fora de cena de baixar as faixas dele. A margem dá só a
    // antecedência de um quarto de tela para a faixa do slide ativo.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasAppeared(true);
      },
      { rootMargin: "25%" },
    );
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  // Mesmo tratamento de `lazy-video.tsx` e `paper-tilt-effect.tsx`: quem
  // pediu menos movimento no sistema não recebe nem loop nem rodízio — fica
  // a primeira faixa, parada.
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // `onFinished` muda a cada render do carousel; a ref evita reiniciar o
  // timer do modo parado por causa disso.
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (!isInView || !prefersReducedMotion.current) return;

    const timer = setTimeout(
      () => onFinishedRef.current(),
      COMBO_STATIC_SLIDE_MS,
    );
    return () => clearTimeout(timer);
  }, [isInView]);

  // Chamado no `ended` da faixa em cena. Ela volta pro zero já aqui, pausada
  // e invisível, para abrir inteira na próxima volta do rodízio.
  const handleVideoEnded = (index: number) => {
    if (index !== activeIndex) return;

    const video = videoRefs.current[index];
    if (video) video.currentTime = 0;

    if (index === srcs.length - 1) onFinished();
    setStep((current) => current + 1);
  };

  // Só a faixa em cena toca; as outras ficam pausadas. Uma faixa que saiu de
  // cena no meio (o banner rolou pra fora da tela) retoma de onde parou.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex && isInView && !prefersReducedMotion.current) {
        // `play()` rejeita com a aba em background ou autoplay bloqueado.
        // Nada a fazer: o vídeo é decorativo.
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    // `step` (e não só `activeIndex`) porque, com uma faixa só, o índice
    // nunca muda e o vídeo precisa voltar a tocar depois do `ended`.
  }, [activeIndex, step, isInView, hasAppeared]);

  return (
    <div ref={stageRef} className="absolute inset-0">
      {srcs.map((src, index) => (
        <video
          key={src}
          ref={(node) => {
            videoRefs.current[index] = node;
          }}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          // `preload="none"` enquanto não é a vez: impede o navegador de
          // gastar conexão com um vídeo que talvez nem chegue a aparecer.
          preload={isLoaded(index) ? "auto" : "none"}
          src={isLoaded(index) ? src : undefined}
          // Sem `loop`: é o `ended` que passa a vez para a próxima faixa.
          onEnded={() => handleVideoEnded(index)}
          muted
          playsInline
        />
      ))}
    </div>
  );
}

/**
 * Painel da direita: o que vem no kit (uma linha por livro, capa parada), o
 * preço e o CTA largo em amarelo da marca. Fundo branco igual ao da seção —
 * quem recorta o banner é a borda arredondada de `ComboBanner`.
 */
function ComboOffer({
  combo,
  books,
  formattedPrice,
  formattedOriginalPrice,
}: {
  combo: Combo;
  books: readonly Book[];
  formattedPrice: string;
  formattedOriginalPrice: string | null;
}) {
  return (
    <div className="flex flex-col gap-6 bg-background p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
          {books.length} títulos no kit
        </span>
        <p className="font-serif text-sm leading-relaxed text-foreground/70">
          {combo.description}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {books.map((book) => (
          <ComboBookRow key={book.slug} book={book} />
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-4 border-t border-border pt-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col">
            {formattedOriginalPrice ? (
              <ComboOriginalPrice formattedOriginalPrice={formattedOriginalPrice} />
            ) : null}
            <span className="flex items-center gap-2 font-display text-3xl font-bold text-foreground tabular-nums sm:text-4xl">
              {formattedOriginalPrice ? <span className="sr-only">Por </span> : null}
              {formattedPrice}
              {formattedOriginalPrice ? (
                <Star
                  aria-hidden="true"
                  className="size-6 animate-combo-star fill-brand-yellow text-brand-yellow sm:size-7"
                />
              ) : null}
            </span>
          </div>

          {combo.freeShipping ? (
            <span className="flex items-center gap-1.5 pb-1 text-xs font-bold tracking-[0.08em] text-primary uppercase">
              <Truck aria-hidden="true" className="size-4" />
              Frete grátis
            </span>
          ) : null}
        </div>

        <AddToCartButton
          type="combo"
          slug={combo.slug}
          label={combo.ctaLabel}
          addedLabel="Adicionado!"
          variant="brand"
          className="h-12 w-full text-base"
        />
      </div>
    </div>
  );
}

/**
 * Preço "de" que se risca sozinho: o traço cresce da esquerda pra direita
 * quando o banner entra em cena, e refaz o gesto toda vez que o slide volta
 * (o `overflow-hidden` do carousel tira os slides parados de vista, então o
 * observer já devolve `false` pra eles).
 *
 * O `<s>` perde o `line-through` nativo (`no-underline`) porque
 * `text-decoration` não anima — quem risca é o `<span>` posicionado. Esse
 * traço nasce sem `transform`, ou seja, já riscado: sem JS, ou com
 * reduced-motion, o preço antigo continua cortado. A animação mostra o
 * gesto, nunca é ela que informa o desconto.
 */
function ComboOriginalPrice({
  formattedOriginalPrice,
}: {
  formattedOriginalPrice: string;
}) {
  const priceRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = priceRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 1 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <s
      ref={priceRef}
      className="relative w-fit font-display text-sm text-muted-foreground no-underline tabular-nums"
    >
      <span className="sr-only">De </span>
      {formattedOriginalPrice}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-1/2 h-px origin-left bg-muted-foreground",
          isInView && "animate-combo-strike",
        )}
      />
    </s>
  );
}

/** Uma linha do kit: capa pequena + título e autor, a linha inteira levando
 *  à página do livro. O link sai do título e se estica sobre a linha com
 *  `after:inset-0` (mesmo padrão de `components/book-card.tsx`): o card todo
 *  fica clicável, mas com uma única parada de tabulação, e o leitor de tela
 *  anuncia o link pelo título, não pela descrição da capa.
 *
 *  A capa continua parada no frame frontal (`still`) — aqui ela é referência
 *  visual do item da lista, não o objeto em destaque —, mas o `group` liga o
 *  zoom de hover/foco do BookCover, que é o sinal de que dá pra clicar. */
function ComboBookRow({ book }: { book: Book }) {
  return (
    <li className="group relative flex items-center gap-3">
      <BookCover
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
        still
        className="w-12 shrink-0 sm:w-14"
      />
      <div className="min-w-0">
        <p className="font-display text-sm leading-snug font-semibold text-foreground">
          <Link
            href={`/catalogo/${book.slug}`}
            className="rounded underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-primary group-hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {book.title}
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">{book.author.name}</p>
      </div>
    </li>
  );
}
