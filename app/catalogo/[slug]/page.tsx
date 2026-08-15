import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllBookSlugs,
  getBookBySlug,
  getCombosForBook,
  getRelatedBooks,
} from "./_data-access/get-book";
import { BookHero } from "./_components/book-hero";
import { ParallaxSection } from "./_components/parallax-section";
import { AboutBookSection } from "./_components/about-book-section";
import { UpsellCard } from "./_components/upsell-card";
import { VideoBannerSection } from "./_components/video-banner-section";
import { UniverseSection } from "./_components/universe-section";
import { CollectionsGuideSection } from "./_components/collections-guide-section";
import { UniverseFamilySection } from "./_components/universe-family-section";
import { RelatedBooks } from "./_components/related-books";
import { CombosSection } from "./_components/combos-section";

/**
 * ============================================================================
 * PÁGINA DE LIVRO — MODELO
 * ============================================================================
 *
 * Esta rota é o template de todas as páginas de livro: `[slug]` é dinâmico,
 * então um único arquivo serve o catálogo inteiro. Para publicar um título
 * novo basta acrescentar o registro em `lib/data/books.ts` — nada aqui muda.
 *
 * Estrutura, seguindo o "Book Detail" do Figma (node 173:893):
 *
 *   _data-access/get-book.ts       busca e integridade dos dados
 *   _components/book-hero          abertura escura: capa, título, sinopse, CTA
 *   _components/parallax-section   faixa decorativa opcional (book.parallax)
 *   _components/about-book-section "O Livro" + "Sobre o Autor" + ficha técnica
 *   _components/upsell-card        item avulso opcional (book.upsell)
 *   _components/video-banner       faixa de vídeo opcional (book.videoBannerSrc)
 *   _components/universe-section   destaque do universo, só quando o livro
 *                                   tem `universeShowcase`
 *   _components/collections-guide  texto institucional das coleções, só no
 *                                   universo de Planta
 *   _components/universe-family    composição decorativa (fundo + capas) do
 *                                   universo, quando `book.universeFamily`
 *                                   existe; senão cai no `related-books`
 *   _components/related-books      grid genérico de outros títulos do
 *                                   mesmo universo (fallback)
 *   _components/combos-section     banners rotativos de combos do catálogo
 *                                   que incluem este livro (getCombosForBook)
 *
 * Decisões que valem manter ao evoluir a página:
 *
 * 1. Server Component por padrão. A única exceção é `parallax-section`, que
 *    precisa calcular o deslocamento no scroll via JS (Safari não suporta
 *    `animation-timeline: view()`, a alternativa 100% CSS) — todo o resto
 *    renderiza no servidor sem JavaScript extra pro usuário.
 * 2. `dynamicParams = false` + `generateStaticParams` deixam todas as páginas
 *    pré-renderizadas no build; um slug inexistente cai direto no not-found.tsx
 *    sem executar render.
 * 3. `params` é uma Promise no Next 16 — precisa de `await`, tanto aqui quanto
 *    em `generateMetadata`.
 * 4. Preço vive em centavos no schema e só vira string em `lib/format.ts`, que
 *    é `server-only` para não arriscar divergência de hidratação.
 * 5. Cada seção decide sozinha se renderiza (retorna `null` quando o dado
 *    opcional não existe) — o catálogo real ainda não tem sinopse, trecho,
 *    ficha técnica nem upsell preenchidos pra nenhum título.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBookSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/catalogo/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const detail = await getBookBySlug(slug);

  if (!detail) {
    return { title: "Livro não encontrado" };
  }

  return {
    title: detail.book.title,
    description: detail.book.synopsis?.slice(0, 155),
  };
}

export default async function BookPage(props: PageProps<"/catalogo/[slug]">) {
  const { slug } = await props.params;
  const detail = await getBookBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { book, universe } = detail;
  const relatedBooks = await getRelatedBooks(book);
  const combos = await getCombosForBook(book);

  return (
    <>
      <BookHero book={book} universe={universe} />
      <ParallaxSection layers={book.parallax ?? []} />
      <AboutBookSection book={book} />
      <UpsellCard book={book} />
      <VideoBannerSection book={book} />
      <UniverseSection universe={universe} book={book} />
      <CollectionsGuideSection universe={universe} />
      {book.universeFamily ? (
        <UniverseFamilySection book={book} universe={universe} />
      ) : (
        <RelatedBooks books={relatedBooks} universe={universe} />
      )}
      <CombosSection combos={combos} />
    </>
  );
}
