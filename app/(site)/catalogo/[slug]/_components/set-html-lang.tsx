"use client";

import { useEffect } from "react";

import type { Locale } from "@/lib/data/schemas";

const HTML_LANG: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
};

/**
 * O App Router só permite um `<html>` (dono do `lang`, no root layout,
 * fixo em "pt-BR"). Como esta é a única rota do site com conteúdo
 * inteiramente noutro idioma (`mr-plant-a-biped-among-plants`), ajusta o
 * atributo no client para leitor de tela pronunciar certo — e devolve o
 * valor do root layout ao desmontar, pra não vazar pra outras páginas
 * navegadas por client-side routing.
 */
export function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.lang;
    html.lang = HTML_LANG[locale];

    return () => {
      html.lang = previous;
    };
  }, [locale]);

  return null;
}
