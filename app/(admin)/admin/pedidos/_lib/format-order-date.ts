/** `lib/format.ts` é `server-only` — este helper existe porque as páginas
 * de pedidos são Client Components (ver spec, seção "O problema central"). */
export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
