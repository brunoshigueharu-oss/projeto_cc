import { UNIVERSES } from "@/lib/data/universes";
import type { Universe } from "@/lib/data/schemas";

/**
 * Declarada `async` de propósito, mesmo sem I/O: é o ponto de troca para um
 * CMS ou banco no futuro, sem precisar alterar nenhum call site.
 */
export async function getUniverses(): Promise<readonly Universe[]> {
  return UNIVERSES;
}
