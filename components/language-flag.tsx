import Image from "next/image";

import type { Book, Locale } from "@/lib/data/schemas";
import { cn } from "@/lib/utils";

type FlagCode = NonNullable<Book["languageFlag"]>;

type LanguageFlagProps = {
  flag: FlagCode;
  locale: Locale;
  className?: string;
};

const FLAGS: Record<FlagCode, { src: string; label: Record<Locale, string> }> = {
  us: {
    src: "/images/bandeiras/us.svg",
    label: { pt: "Edição em inglês", en: "English edition" },
  },
};

/**
 * Bandeira que acompanha o título de uma edição impressa em outro idioma —
 * na página do livro, no card do catálogo e no card de upsell.
 *
 * Vai inline no fim do título e é dimensionada em `em`, então acompanha o
 * tamanho do heading onde estiver. Títulos menores (cards) podem subir a
 * proporção via `className` (ex. `h-[0.6em]`) para a bandeira não sumir.
 */
export function LanguageFlag({ flag, locale, className }: LanguageFlagProps) {
  const { src, label } = FLAGS[flag];

  return (
    <Image
      src={src}
      alt={label[locale]}
      title={label[locale]}
      width={38}
      height={20}
      className={cn(
        "ml-[0.3em] inline-block h-[0.5em] w-auto rounded-[2px] align-[0.12em] ring-1 ring-foreground/10",
        className,
      )}
    />
  );
}
