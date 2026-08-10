import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Seal } from "@/components/seal";
import {
  getAllBookSlugs,
  getBookBySlug,
  getRelatedBooks,
} from "./_data-access/get-book";
import { BookHero } from "./_components/book-hero";
import { BookSpecs } from "./_components/book-specs";
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
 * Como está organizada:
 *
 *   _data-access/get-book.ts   busca e integridade dos dados
 *   _components/book-hero      abertura escura: capa, título, preço, CTA
 *   _components/book-specs     ficha técnica em <dl>
 *   _components/related-books  outros títulos do mesmo universo
 *   (sinopse e trecho ficam inline abaixo — são só tipografia)
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
    description: detail.book.synopsis.slice(0, 155),
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

      {/* Sinopse — largura de leitura curta e serifada, como o corpo do livro. */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-prose">
          <h2 className="font-display text-2xl text-foreground">Sobre o livro</h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-foreground/80">
            {book.synopsis}
          </p>
        </div>

        {/* Trecho: opcional no schema, então a seção inteira é condicional. */}
        {book.excerpt ? (
          <figure className="relative mt-14 max-w-3xl overflow-hidden rounded-xl border border-border bg-muted p-8 sm:p-12">
            <Seal
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 size-40 opacity-[0.04]"
            />
            <blockquote className="relative font-serif text-xl leading-relaxed text-foreground/85 sm:text-2xl">
              {book.excerpt}
            </blockquote>
            <figcaption className="relative mt-6 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Trecho de {book.title}
            </figcaption>
          </figure>
        ) : null}
      </section>

      <BookSpecs book={book} />

      {/* Sobre o autor */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-prose">
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
              Autoria
            </span>
            <h2 className="mt-3 font-display text-2xl text-foreground">
              {book.author.name}
            </h2>
            <p className="mt-4 font-serif leading-relaxed text-muted-foreground">
              {book.author.bio}
            </p>
          </div>
        </div>
      </section>

      <RelatedBooks books={relatedBooks} universe={universe} />
    </>
  );
}
