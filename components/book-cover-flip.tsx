"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import type { Book, Locale } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";
import { BookCover } from "./book-cover";

const LABELS: Record<
  Locale,
  {
    showBack: string;
    showFront: string;
    backAlt: (title: string) => string;
  }
> = {
  pt: {
    showBack: "Ver a parte de trás",
    showFront: "Ver a frente",
    backAlt: (title) => `Contracapa de ${title}`,
  },
  en: {
    showBack: "See the back",
    showFront: "See the front",
    backAlt: (title) => `Back cover of ${title}`,
  },
};

/**
 * Capa em destaque com o botão de virar o exemplar.
 *
 * Vive onde o livro é o objeto em destaque da página: o hero do catálogo e as
 * duas vitrines de `/campanhas` (o título da campanha e a edição especial). No
 * card do catálogo a capa segue sendo só a frente — ali ela é miniatura de uma
 * grade, e o giro é conteúdo de detalhe do título (ver `backVideoSrc` em
 * lib/data/schemas.ts). Sem esse asset no título, o componente renderiza a
 * mesma capa de sempre, sem botão.
 *
 * O botão é só ícone, no mesmo vidro do botão de pausar e colado nele, no
 * canto superior direito do quadro: os dois controles da mídia ficam juntos e
 * fora da ilustração. A pílula com texto no canto de baixo pesava mais que a
 * mídia que comanda — o texto segue no `aria-label` e no tooltip.
 *
 * O `backVideoSrc` só desce para o BookCover depois do primeiro clique: é um
 * arquivo do mesmo peso do vídeo de capa (~5 MB), e quem não virar o livro não
 * deve pagar o download dele ao abrir a página. Depois disso a tag fica
 * montada, então virar de novo é instantâneo e não reinicia o loop.
 *
 * Quem cuida de as duas faces chegarem na mesma pose e no mesmo tamanho é o
 * BookCover (sincronia de `currentTime`) junto com o `backVideoScale` do
 * título — aqui só se decide quando virar.
 */
export function BookCoverFlip({ book }: { book: Book }) {
  const [showBack, setShowBack] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const labels = LABELS[book.locale];

  // Sem o vídeo de capa o quadro cai no placeholder, que não tem frente pra
  // virar — o botão ficaria ali sem fazer nada. Acontece no título cadastrado
  // com o verso antes da frente, já que o schema aceita um sem o outro.
  const canFlip = Boolean(book.coverVideoSrc) && Boolean(book.backVideoSrc);

  function handleFlip() {
    setHasFlipped(true);
    setShowBack((prev) => !prev);
  }

  return (
    <div className="group/flip relative">
      <BookCover
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
        backVideoSrc={canFlip && hasFlipped ? book.backVideoSrc : undefined}
        showBack={showBack}
        backVideoOffsetY={book.backVideoOffsetY}
        backVideoScale={book.backVideoScale}
        backVideoPhase={book.backVideoPhase}
        backAlt={labels.backAlt(book.title)}
        showPauseControl
        size="lg"
        className="w-full"
      />

      {canFlip ? (
        // `right-10` põe o botão logo à esquerda do de pausar (right-1, size-8
        // em book-cover.tsx), com 4px de respiro entre os dois.
        <button
          type="button"
          onClick={handleFlip}
          aria-label={showBack ? labels.showFront : labels.showBack}
          title={showBack ? labels.showFront : labels.showBack}
          className="absolute right-10 top-3 z-10 flex size-8 items-center justify-center rounded-full glass glass-lens border border-white/25 bg-black/20 text-white opacity-50 [--glass-blur:4px] transition-all duration-200 hover:opacity-100 hover:bg-black/30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/flip:opacity-80"
        >
          {/* Mesmo tamanho do ícone de pausar; o traço mais grosso compensa
              o Pause ser preenchido e este só contorno. */}
          <RotateCcw
            aria-hidden="true"
            strokeWidth={3}
            className={cn(
              "size-3.5 transition-transform duration-500",
              showBack && "-scale-x-100",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
