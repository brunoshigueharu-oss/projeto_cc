import { BOOKS_BY_SLUG } from "@/lib/data/books";
import { CAMPAIGN } from "@/lib/data/campaigns";
import type { Book, Campaign } from "@/lib/data/schemas";

export type CampaignDetail = {
  campaign: Campaign;
  /**
   * Título principal da campanha — o primeiro de `relatedBookSlugs`. É dele
   * que a página tira ficha técnica, criador e páginas internas, em vez de
   * duplicar esses dados no registro da campanha.
   *
   * `undefined` quando a campanha não aponta para nenhum livro (evento sem
   * título associado, por exemplo): as seções dependentes somem.
   */
  primaryBook: Book | undefined;
  /** Demais títulos citados, na ordem de `relatedBookSlugs`. */
  otherBooks: readonly Book[];
};

export async function getCampaign(): Promise<CampaignDetail> {
  const books = CAMPAIGN.relatedBookSlugs.flatMap((bookSlug) => {
    const book = BOOKS_BY_SLUG.get(bookSlug);
    return book ? [book] : [];
  });

  return {
    campaign: CAMPAIGN,
    primaryBook: books.at(0),
    otherBooks: books.slice(1),
  };
}
