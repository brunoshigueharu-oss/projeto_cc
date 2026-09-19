"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

import { BookCover } from "@/components/book-cover";
import type { Book, Locale } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

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
 * Capa do hero com o botão de virar o exemplar.
 *
 * Existe só nesta página: o giro da contracapa é conteúdo de detalhe do
 * título, não da vitrine — no card do catálogo a capa segue sendo só a frente
 * (ver `backVideoSrc` em lib/data/schemas.ts). Sem esse asset no título, o
 * componente renderiza a mesma capa de sempre, sem botão.
 *
 * O botão flutua no canto inferior direito do próprio quadro, em vidro: como
 * bloco abaixo da capa ele separava o vídeo da fileira de páginas internas e
 * pesava mais que a mídia que comanda.
 *
 * O `backVideoSrc` só desce para o BookCover depois do primeiro clique: é um
 * arquivo do mesmo peso do vídeo de capa (~5 MB), e quem não virar o livro não
 * deve pagar o download dele ao abrir a página. Depois disso a tag fica
 * montada, então virar de novo é instantâneo e não reinicia o loop.
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
    <div className="relative">
      <BookCover
        title={book.title}
        alt={book.coverAlt}
        videoSrc={book.coverVideoSrc}
        videoScale={book.coverVideoScale}
        videoFit={book.coverVideoFit}
        backVideoSrc={canFlip && hasFlipped ? book.backVideoSrc : undefined}
        showBack={showBack}
        backVideoOffsetY={book.backVideoOffsetY}
        backAlt={labels.backAlt(book.title)}
        showPauseControl
        size="lg"
        className="w-full"
      />

      {canFlip ? (
        <button
          type="button"
          onClick={handleFlip}
          aria-pressed={showBack}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-[10px] transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <RotateCw
            aria-hidden="true"
            className={cn(
              "size-3.5 transition-transform duration-500",
              showBack && "-scale-x-100",
            )}
          />
          {showBack ? labels.showFront : labels.showBack}
        </button>
      ) : null}
    </div>
  );
}
