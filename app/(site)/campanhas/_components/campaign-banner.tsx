"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";

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
 * autoplay do `videoBannerSrc` do livro (ver `video-banner-section.tsx`).
 * Como o vídeo é o único elemento visual da faixa, o `alt` vira um texto
 * `sr-only` em vez de simplesmente marcar o vídeo `aria-hidden`.
 *
 * Quando a campanha também tem `bannerVideoNight`, os dois vídeos ficam
 * empilhados e sempre tocando (ambos mudos) — alternar só troca a opacidade,
 * sem recarregar o vídeo nem perder o ponto do loop. O botão fica sempre
 * visível (não só no hover) e com rótulo de texto: é o único controle da
 * faixa, então precisa se anunciar em vez de se esconder como um ícone mudo.
 *
 * A faixa sangra de ponta a ponta com cantos retos, como no site antigo — é o
 * único bloco full-bleed da página.
 *
 * A trilha de navegação fica acima da faixa, não sobre ela: sobre a arte
 * exigiria um scrim que o Figma não prevê.
 */
export function CampaignBanner({ campaign }: { campaign: Campaign }) {
  const [isNight, setIsNight] = useState(false);

  const hasArt = Boolean(campaign.bannerVideo ?? campaign.banner);
  const hasDayNight = Boolean(campaign.bannerVideo && campaign.bannerVideoNight);

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
          hasArt ? "bg-muted" : TONE_BACKGROUND_SOFT[campaign.tone],
        )}
      >
        {campaign.bannerVideo ? (
          <>
            <video
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover transition-opacity duration-500"
              style={hasDayNight ? { opacity: isNight ? 0 : 1 } : undefined}
              src={campaign.bannerVideo.src}
              autoPlay
              loop
              muted
              playsInline
            />
            {hasDayNight ? (
              <video
                aria-hidden="true"
                className="absolute inset-0 size-full object-cover transition-opacity duration-500"
                style={{ opacity: isNight ? 1 : 0 }}
                src={campaign.bannerVideoNight!.src}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : null}
            <span className="sr-only">
              {isNight ? campaign.bannerVideoNight!.alt : campaign.bannerVideo.alt}
            </span>
            {hasDayNight ? (
              <button
                type="button"
                onClick={() => setIsNight((prev) => !prev)}
                aria-label={
                  isNight ? "Ver versão diurna do vídeo" : "Ver versão noturna do vídeo"
                }
                className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/24 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-[10px] transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-6 sm:top-6"
              >
                {isNight ? (
                  <Sun className="size-4" aria-hidden="true" />
                ) : (
                  <Moon className="size-4" aria-hidden="true" />
                )}
                <span>{isNight ? "Ver de dia" : "Ver de noite"}</span>
              </button>
            ) : null}
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
