import Image from "next/image";
import Link from "next/link";

import type { Book } from "@/lib/data/schemas";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";

type FeaturedBookCardProps = {
  book: Book;
  className?: string;
};

/**
 * Card de livro em destaque na prateleira da Home — still próprio (ver
 * `featuredCardImage`), não o preview em vídeo usado no Catálogo.
 */
export function FeaturedBookCard({ book, className }: FeaturedBookCardProps) {
  if (!book.featuredCardImage) return null;

  return (
    <Link
      href={`/catalogo/${book.slug}`}
      className={cn(
        "group relative flex aspect-3/4 flex-col justify-end overflow-hidden rounded-xl border border-border p-5 text-white shadow-sm",
        TONE_BACKGROUND[book.coverTone],
        className,
      )}
    >
      <Image
        src={book.featuredCardImage.src}
        alt={book.featuredCardImage.alt}
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-focus-within:scale-110"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.55)_100%)]"
      />

      <h3 className="relative font-display text-lg leading-tight">{book.title}</h3>
      <p className="relative mt-1 font-serif text-xs text-white/75">{book.author.name}</p>
    </Link>
  );
}
