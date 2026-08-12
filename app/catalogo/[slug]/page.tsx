import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllBookSlugs,
  getBookBySlug,
  getRelatedBooks,
} from "./_data-access/get-book";
import { BookHero } from "./_components/book-hero";
import { AboutBookSection } from "./_components/about-book-section";
import { UpsellCard } from "./_components/upsell-card";
import { UniverseSection } from "./_components/universe-section";
import { CollectionsGuideSection } from "./_components/collections-guide-section";
import { RelatedBooks } from "./_components/related-books";

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
 *   _components/about-book-section "O Livro" + "Sobre o Autor" + ficha técnica
 *   _components/upsell-card        item avulso opcional (book.upsell)
 *   _components/universe-section   destaque escuro do universo do livro
 *   _components/collections-guide  texto institucional estático
 *   _components/related-books      outros títulos do mesmo universo
 *
 * Decisões que valem manter ao evoluir a página:
 *
 * 1. NENHUM componente desta rota é Client Component. Não há estado nem evento
 *    aqui, então tudo renderiza no servidor e o usuário não baixa JavaScript
 *    por causa desta página.
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

  return (
    <>
      <BookHero book={book} universe={universe} />
      <AboutBookSection book={book} />
      <UpsellCard book={book} />
      <UniverseSection universe={universe} />
      <CollectionsGuideSection />
      <RelatedBooks books={relatedBooks} universe={universe} />
    </>
  );
}
