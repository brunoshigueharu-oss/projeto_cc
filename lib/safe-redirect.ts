/**
 * Valida o destino do `?redirect=` (ex.: depois do login) para que ele só
 * aponte para páginas deste site.
 *
 * Checar só o começo da string não basta: o navegador remove TAB/CR/LF de
 * URLs, então `/\t/evil.com` passa por um teste de "começa com uma barra só"
 * e vira `//evil.com`, que leva a outro domínio. Por isso a URL é resolvida
 * de verdade e a origem final é comparada.
 *
 * @param value Valor bruto vindo da URL.
 * @param origin Origem do site (`window.location.origin` no browser).
 * @param fallback Caminho usado quando o valor é ausente ou inseguro.
 * @returns Caminho relativo (pathname + search + hash) seguro para navegar.
 */
export function getSafeRedirect(
  value: string | null | undefined,
  origin: string,
  fallback = "/",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  // Caracteres de controle e barra invertida são normalizados pelo
  // navegador de formas que viram outro host — recusa de cara.
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;

  try {
    const url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
