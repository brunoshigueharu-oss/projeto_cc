"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Seal } from "@/components/seal";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/data/schemas";

const CAROUSEL_ARROW_CLASSNAME =
  "absolute top-1/2 z-10 flex size-[72px] -translate-y-1/2 items-center justify-center rounded-full border border-white/24 bg-white/8 text-white backdrop-blur-[10px] transition-colors hover:bg-white/16";

type HeroProps = {
  banners: readonly Campaign[];
};

export function Hero({ banners }: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (banners.length === 0) return null;

  const banner = banners[activeIndex];
  const hasMultipleBanners = banners.length > 1;

  function goTo(index: number) {
    setActiveIndex((index + banners.length) % banners.length);
  }

  return (
    <section className="dark relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_60%_at_80%_15%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/2 hidden size-[34rem] -translate-y-1/2 opacity-[0.035] sm:block">
        <Seal className="size-full" />
      </div>

      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label="Slide anterior"
            onClick={() => goTo(activeIndex - 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "left-10 hidden lg:flex")}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Próximo slide"
            onClick={() => goTo(activeIndex + 1)}
            className={cn(CAROUSEL_ARROW_CLASSNAME, "right-10 hidden lg:flex")}
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
        </>
      )}

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-accent">
            <Seal className="size-4" />
            {banner.kicker}
          </span>
          <h1 className="mt-6 text-balance font-display text-5xl leading-[1.05] sm:text-6xl">
            {banner.title}
          </h1>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-foreground/70">
            {banner.description}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href={banner.ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-full bg-primary px-7 text-primary-foreground hover:bg-primary/85"
              )}
            >
              {banner.ctaLabel}
            </Link>
            <Link
              href="/catalogo"
              className="text-sm font-medium text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>

      {hasMultipleBanners && (
        <div className="relative flex items-center justify-center gap-2 pb-8 lg:absolute lg:inset-x-0 lg:bottom-8 lg:pb-0">
          {banners.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              aria-label={`Ir para ${item.title}`}
              aria-current={index === activeIndex}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full bg-white/30 transition-all",
                index === activeIndex ? "w-6 bg-primary" : "w-1.5 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
