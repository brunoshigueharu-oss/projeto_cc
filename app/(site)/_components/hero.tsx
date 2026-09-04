"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HomeBanner } from "@/lib/data/schemas";

const CAROUSEL_ARROW_CLASSNAME =
  "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-white/8 text-white backdrop-blur-[10px] transition-colors hover:bg-white/16";

type HeroProps = {
  banners: readonly HomeBanner[];
};

/**
 * Hero da Home = carrossel de vídeos em faixa cheia (mudo/loop/autoplay),
 * sem texto sobreposto. Cada vídeo é um link para a página do livro
 * correspondente.
 */
export function Hero({ banners }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (banners.length === 0) return null;

  const banner = banners[activeIndex];
  const hasMultipleBanners = banners.length > 1;

  function goTo(index: number) {
    setActiveIndex((index + banners.length) % banners.length);
  }

  return (
    <section className="relative overflow-hidden bg-background">
      <Link
        href={banner.href}
        aria-label={`Ver ${banner.bookTitle}`}
        className="block aspect-square w-full sm:aspect-[1785/650]"
      >
        <video
          key={banner.slug}
          aria-hidden="true"
          className="size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          {banner.videoSrcMobile && (
            <source src={banner.videoSrcMobile} media="(max-width: 639px)" />
          )}
          <source src={banner.videoSrc} />
        </video>
      </Link>

      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(activeIndex - 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "left-10 hidden lg:flex")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => goTo(activeIndex + 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "right-10 hidden lg:flex")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2">
            {banners.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                aria-label={`Ir para banner ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className={cn(
                  "h-1.5 rounded-full bg-white/30 transition-all",
                  index === activeIndex ? "w-6 bg-primary" : "w-1.5 hover:bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
