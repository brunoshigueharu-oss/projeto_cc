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
 * arte (`campaign.banner`/`campaign.bannerVideo`), o lugar dela é preenchido
 * pela cor do universo em versão lavada, em vez de um retângulo cinza vazio;
 * a cor cheia numa área desse tamanho pesava mais que a própria campanha.
 *
 * `bannerVideo` tem prioridade sobre `banner`: mesmo padrão mudo/loop/
 * autoplay do `videoBannerSrc` do livro (ver `video-banner.tsx`).
 * Como o vídeo é o único elemento visual da faixa, o `alt` vira um texto
 * `sr-only` em vez de simplesmente marcar o vídeo `aria-hidden`.
 *
 * A faixa sangra de ponta a ponta com cantos retos, como no site antigo — é o
 * único bloco full-bleed da página.
 *
 * A trilha de navegação fica acima da faixa, não sobre ela: sobre a arte
 * exigiria um scrim que o Figma não prevê.
 */
export function CampaignBanner({ campaign }: { campaign: Campaign }) {
  const hasArt = Boolean(campaign.bannerVideo ?? campaign.banner);

  return (
    <>
      <nav
        aria-label="Trilha de navegação"
        className="mx-auto max-w-6xl px-4 pt-5 sm:px-6"
      >
        <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
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
          hasArt ? "bg-muted" : TONE_BACKGROUND_SOFT[campaign.tone],
        )}
      >
        {campaign.bannerVideo ? (
          <>
            <video
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
              src={campaign.bannerVideo.src}
              autoPlay
              loop
              muted
              playsInline
            />
            <span className="sr-only">{campaign.bannerVideo.alt}</span>
          </>
        ) : campaign.banner ? (
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
