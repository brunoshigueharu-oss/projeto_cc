import "server-only";

export { formatPrice } from "@/lib/format-price";

/**
 * Formatação localizada.
 *
 * `server-only` é intencional: a resolução de locale de data pode divergir
 * entre servidor e navegador — usar isto num Client Component causaria erro
 * de hidratação. Formate no servidor e passe a string pronta.
 */

const dateFormatters = {
  pt: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
  en: new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long", year: "numeric" }),
};

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Recebe data ISO ("2025-10-14"). O `T00:00` evita deslocamento de fuso. */
export function formatDate(isoDate: string, locale: "pt" | "en" = "pt"): string {
  return dateFormatters[locale].format(new Date(`${isoDate}T00:00:00`));
}

export function formatDateRange(startsAt: string, endsAt: string | null): string {
  const start = shortDateFormatter.format(new Date(`${startsAt}T00:00:00`));
  if (!endsAt) {
    return `A partir de ${start}`;
  }
  return `${start} — ${shortDateFormatter.format(new Date(`${endsAt}T00:00:00`))}`;
}
