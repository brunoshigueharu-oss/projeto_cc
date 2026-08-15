import Image from "next/image";
import Link from "next/link";

import type { Campaign } from "@/lib/data/schemas";
import { TONE_BACKGROUND_SOFT } from "@/lib/tone";
import { cn } from "@/lib/utils";

/**
 * Faixa de abertura da campanha (node 211:1366 do Figma).
 *
 * No Figma é um retângulo cheio, sem texto: a arte da campanha ocupa a faixa
 * inteira e o título só aparece na seção "Sobre o projeto", logo abaixo. Aqui
 * a faixa se degrada como o resto do site — enquanto a editora não envia a
 * arte (`campaign.banner`), o lugar dela é preenchido pela cor do universo em
 * versão lavada, em vez de um retângulo cinza vazio; a cor cheia numa área
 * desse tamanho pesava mais que a própria campanha.
 *
 * A faixa sangra de ponta a ponta com cantos retos, como no site antigo — é o
 * único bloco full-bleed da página.
 *
 * A trilha de navegação fica acima da faixa, não sobre ela: sobre a arte
 * exigiria um scrim que o Figma não prevê.
 */
export function CampaignBanner({ campaign }: { campaign: Campaign }) {
  return (
    <>
      <nav
        aria-label="Trilha de navegação"
        className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"
      >
        <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/campanhas" className="hover:text-foreground">
              Campanhas
            </Link>
          </li>
        </ol>
      </nav>

      <div
        className={cn(
          "relative mt-5 aspect-[16/9] w-full overflow-hidden sm:aspect-[1440/540]",
          campaign.banner ? "bg-muted" : TONE_BACKGROUND_SOFT[campaign.tone],
        )}
      >
        {campaign.banner ? (
          <Image
            src={campaign.banner.src}
            alt={campaign.banner.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
      </div>
    </>
  );
}
