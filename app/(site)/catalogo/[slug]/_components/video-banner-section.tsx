import type { Book } from "@/lib/data/schemas";
import { VideoBanner } from "@/components/video-banner";

/**
 * Faixa de vídeo do livro, entre o card de exemplar avulso e o destaque do
 * universo. Retorna `null` quando o título não tem esse asset — a maioria do
 * catálogo ainda não tem.
 *
 * A faixa em si mora em `components/video-banner.tsx`, compartilhada com a
 * página de campanha; aqui fica só a resolução dos campos do livro. Quando o
 * título também tem `videoBannerNightSrc`, a faixa ganha o botão de alternar
 * entre dia e noite.
 */
export function VideoBannerSection({ book }: { book: Book }) {
  if (!book.videoBannerSrc) {
    return null;
  }

  return (
    <VideoBanner
      src={book.videoBannerSrc}
      nightSrc={book.videoBannerNightSrc}
    />
  );
}
