import { cn } from "@/lib/utils";

/**
 * Sobre o que a fileira fica: `page` é a seção branca do site (bolinhas
 * escuras), `media` é banner de vídeo ou arte (bolinhas brancas). A
 * geometria é a mesma nos dois; só a cor muda, pra bolinha não sumir no fundo.
 */
type CarouselDotsTone = "page" | "media";

const TONE_CLASSNAMES: Record<
  CarouselDotsTone,
  { button: string; active: string; inactive: string }
> = {
  page: {
    // 44px de altura, como era antes de unificar: sobre a página não há
    // vizinho clicável disputando o toque.
    button: "h-11 focus-visible:outline-primary",
    active: "bg-primary",
    inactive: "bg-foreground/20 group-hover:bg-foreground/40",
  },
  media: {
    // 24px: a fileira fica sobre o Link do banner, e alvo mais alto roubaria
    // o clique da mídia.
    button: "h-6 focus-visible:outline-white",
    active: "bg-white/90",
    inactive: "bg-white/35 group-hover:bg-white/60",
  },
};

type CarouselDotsProps = {
  /** Quantidade de itens do carrossel. Com menos de 2 nada é renderizado. */
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Rótulo acessível de cada bolinha, ex.: `Ir para foto 3`. */
  getLabel: (index: number) => string;
  tone?: CarouselDotsTone;
  className?: string;
};

/**
 * Indicador de posição de todo carrossel/galeria do site: bolinhas de 6px
 * soltas, sem cápsula nem vidro, a atual esticada em pílula de 24px.
 *
 * Cada bolinha é um botão mais alto que o desenho, com a pílula de 6px
 * centralizada: a pílula continua pequena, mas o alvo de toque não.
 */
export function CarouselDots({
  count,
  activeIndex,
  onSelect,
  getLabel,
  tone = "page",
  className,
}: CarouselDotsProps) {
  if (count < 2) return null;

  const classNames = TONE_CLASSNAMES[tone];

  return (
    <div
      className={cn(
        "mx-auto flex w-fit max-w-full flex-wrap items-center justify-center",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={getLabel(index)}
          aria-current={index === activeIndex}
          onClick={() => onSelect(index)}
          className={cn(
            "group flex touch-manipulation items-center rounded-full px-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
            classNames.button,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "block h-1.5 rounded-full transition-[width,background-color]",
              index === activeIndex ? cn("w-6", classNames.active) : cn("w-1.5", classNames.inactive),
            )}
          />
        </button>
      ))}
    </div>
  );
}
