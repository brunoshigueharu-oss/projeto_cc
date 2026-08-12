import { BOOKS } from "@/lib/data/books";
import type { Book } from "@/lib/data/schemas";

/**
 * Declarada `async` de propósito, mesmo sem I/O: é o ponto de troca para um
 * CMS ou banco no futuro, sem precisar alterar nenhum call site.
 */
export async function getFeaturedBooks(): Promise<readonly Book[]> {
  return BOOKS.filter((book) => book.featured);
}
