"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GalleryLightbox, prefersReducedMotion } from "@/components/gallery/gallery-lightbox";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Campaign } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

type GalleryImages = NonNullable<Campaign["gallery"]>;

/** Mesma pílula de vidro das setas de carrossel do resto do site
 * (`box-contents-section.tsx`): sobre fundo claro o vidro é `background/80`
 * com blur, não o `white/8` que o Hero usa sobre vídeo. */
const NAV_BUTTON_CLASSNAME =
  "flex size-11 border-border bg-background/80 text-foreground shadow-sm backdrop-blur-[10px] hover:bg-background disabled:opacity-40 sm:flex";

/**
 * Fileira horizontal com as páginas do miolo, em carrossel embla — a grade
 * anterior recortava cada página num quadro `4/3` com `object-cover` e as
 * ilustrações (que são retrato, ~1181×1600) chegavam decapitadas.
 *
 * Aqui cada página aparece inteira e no formato original: a moldura é um
 * retângulo `3/4` fixo — um fio mais larga que a mais larga das artes — e o
 * `object-contain` encaixa a arte dentro dela sem cortar nem distorcer, seja
 * qual for a proporção exata do arquivo. A sobra lateral (no máximo ~2% de
 * cada lado, porque as digitalizações variam de 1155 a 1192px de largura)
 * fica invisível porque a moldura não tem borda nem fundo — a página flutua
 * solta sobre o papel da seção.
 *
 * A sombra é `drop-shadow` (filtro), não `shadow` (box-shadow): o filtro
 * segue o alfa do que foi renderizado, então abraça a borda real da arte em
 * vez do retângulo da moldura — é o que faz a sobra do `object-contain`
 * desaparecer. No hover a página sobe alguns pixels e a sombra abre junto,
 * dando a impressão de que ela descolou do papel; sem zoom, para não
 * atropelar as vizinhas. A curva é a default do Tailwind (`ease-in-out`,
 * `cubic-bezier(.4,0,.2,1)`), não o `ease-out` que estava aqui antes: o
 * `ease-out` arranca na velocidade máxima, e num deslocamento de 16px isso
 * lê como tranco. Partindo e chegando devagar, a página parece estar sendo
 * levantada, não empurrada.
 *
 * O `py-12` do trilho é o que dá espaço para essa subida e para a sombra: o
 * viewport do embla é `overflow-hidden` e cortaria as duas. Sendo simétrico,
 * ele também mantém as setas centradas na altura das páginas.
 *
 * `loop` faz a fileira dar a volta: depois da última página vem a primeira, e
 * as duas setas já nascem ativas — o mesmo carrossel infinito da prateleira
 * da Home (`featured-books-shelf-scroller.tsx`) e dos itens da caixa
 * (`box-contents-section.tsx`). Só é ligado com mais de uma página porque o
 * embla volta sozinho para `false` (e avisa no console) quando os slides não
 * enchem o viewport. Com o loop ligado não existe mais ponta de trilho para
 * aparar, e é por isso que o `containScroll: "trimSnaps"` que estava aqui
 * saiu: ele só tem efeito no carrossel finito.
 *
 * Com snap (sem `dragFree`, ao contrário do carrossel dos itens da caixa):
 * aqui a página é grande e a fileira é curta, e o momentum do `dragFree`
 * multiplicava o gesto — 120px de trackpad viravam ~440px de trilho — e
 * ainda parava a fileira entre duas páginas. Aí a seta seguinte andava ora
 * uma página inteira, ora um naco de 100px, porque ela vai sempre para o
 * snap seguinte ao mais próximo, não uma página adiante de onde a fileira
 * parou. Com snap, gesto e seta terminam sempre numa página alinhada.
 *
 * `skipSnaps: true` é o que tira o puxão de volta no fim de cada gesto. O
 * embla só atualiza o índice selecionado quando um scroll termina (o
 * `scrollTo` do core), nunca durante o arrasto. Com `skipSnaps` no default
 * (`false`), ao soltar um gesto vigoroso ele manda o trilho para uma página
 * adiante **do índice de onde o gesto começou** (`allowedForce` ->
 * `scrollTarget.byIndex(index ± 1)`), e não para onde o gesto levou a
 * fileira — que, num swipe de trackpad, já são duas ou três páginas adiante.
 * O trilho ia com o dedo e voltava quase tudo: o tranco ao contrário que se
 * sentia aqui. Com `skipSnaps: true` o destino passa a ser calculado a
 * partir da posição alcançada, então a fileira só acomoda até a página mais
 * próxima, sem nunca voltar — e continua terminando alinhada num snap, que é
 * a única coisa de que as setas precisam.
 *
 * `duration: 30` é o tween do embla — não é milissegundo, é a constante da
 * simulação de atração (25 é o padrão, a faixa útil vai de 20 a 60). Um fio
 * mais lento que o padrão para o encaixe não ser seco.
 */
export function CampaignPagesGallery({ images }: { images: GalleryImages }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const thumbnails = useRef<(HTMLButtonElement | null)[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [wheelGesturesPlugin] = useState(() => WheelGesturesPlugin());

  useEffect(() => {
    if (!api) return;
    const update = () => setActiveIndex(api.selectedScrollSnap());
    api.on("select", update);
    api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => api.reInit({ duration: media.matches ? 0 : 30 });
    updateMotion();
    media.addEventListener("change", updateMotion);
    return () => media.removeEventListener("change", updateMotion);
  }, [api]);

  if (images.length === 0) return null;

  return (
    <>
      <Carousel
        setApi={setApi}
        onKeyDownCapture={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            if (event.key === "ArrowLeft") api?.scrollPrev(prefersReducedMotion());
            else api?.scrollNext(prefersReducedMotion());
          }
        }}
        opts={{ loop: images.length > 1, align: "start", skipSnaps: true, duration: 30 }}
        plugins={[wheelGesturesPlugin]}
        className="w-full"
      >
        <CarouselContent className="-ml-5 cursor-grab py-12 sm:-ml-6 active:cursor-grabbing">
          {images.map((image, index) => (
            <CarouselItem key={image.src} className="basis-auto pl-5 sm:pl-6">
              <button
                ref={(node) => { thumbnails.current[index] = node; }}
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Ver página maior: ${image.alt}`}
                className="group block h-[340px] w-[255px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:h-[440px] sm:w-[330px] lg:h-[520px] lg:w-[390px]"
              >
                {/* `alt=""`: o texto já está no `aria-label` do botão, e
                    repeti-lo aqui faria o leitor de tela dizer duas vezes.
                    `width`/`height` são só o tamanho de render pedido ao
                    otimizador — não a proporção do arquivo, que varia de
                    página para página e quem resolve é o `object-contain`. */}
                <Image
                  src={image.src}
                  alt=""
                  width={390}
                  height={520}
                  draggable={false}
                  sizes="(min-width: 1024px) 390px, (min-width: 640px) 330px, 255px"
                  className="size-full select-none object-contain drop-shadow-xl transition-[transform,filter] duration-300 ease-in-out motion-safe:group-hover:-translate-y-4 motion-safe:group-hover:drop-shadow-2xl motion-reduce:transition-none"
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>

        {images.length > 1 ? (
          <>
            <CarouselPrevious aria-label="Página anterior" onClick={() => api?.scrollPrev(prefersReducedMotion())} className={cn(NAV_BUTTON_CLASSNAME, "left-2 sm:left-4")} />
            <CarouselNext aria-label="Próxima página" onClick={() => api?.scrollNext(prefersReducedMotion())} className={cn(NAV_BUTTON_CLASSNAME, "right-2 sm:right-4")} />
          </>
        ) : null}
      </Carousel>

      {images.length > 1 ? (
        <div className="flex flex-wrap justify-center">
          {images.map((image, index) => (
            <button key={image.src} type="button" aria-label={`Ir para página ${index + 1}`} aria-current={activeIndex === index} onClick={() => api?.scrollTo(index, prefersReducedMotion())} className="flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span aria-hidden="true" className={cn("h-1.5 rounded-full motion-safe:transition-all", activeIndex === index ? "w-6 bg-primary" : "w-1.5 bg-foreground/15")} />
            </button>
          ))}
        </div>
      ) : null}
      {openIndex !== null ? (
        <GalleryLightbox
          images={images}
          initialIndex={openIndex}
          getThumbnail={(index) => thumbnails.current[index]}
          revealThumbnail={(index) => {
            thumbnails.current[index]?.closest("[data-slot=carousel]")?.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
            api?.scrollTo(index, true);
          }}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}
