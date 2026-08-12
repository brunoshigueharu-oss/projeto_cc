"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Book } from "@/lib/data/schemas";

/**
 * Faixa de vídeo em largura cheia, entre o card de exemplar avulso e o
 * destaque do universo. Mesmo padrão mudo/loop/autoplay do vídeo de capa
 * (`coverVideoSrc`, ver `components/book-cover.tsx`). Retorna `null` quando
 * o título não tem esse asset — a maioria do catálogo ainda não tem.
 */
export function VideoBannerSection({ book }: { book: Book }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  if (!book.videoBannerSrc) {
    return null;
  }

  function handleToggle() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  return (
    <section className="group/video relative border-t border-border bg-background">
      <video
        ref={videoRef}
        aria-hidden="true"
        className="h-40 w-full object-cover sm:h-56 md:h-64 lg:h-72"
        src={book.videoBannerSrc}
        autoPlay
        loop
        muted
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute left-1/2 top-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white opacity-50 backdrop-blur-[2px] transition-all duration-200 hover:opacity-100 hover:bg-black/25 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover/video:opacity-80"
      >
        {isPlaying ? (
          <Pause className="size-3.5 fill-current" />
        ) : (
          <Play className="size-3.5 fill-current" />
        )}
      </button>
    </section>
  );
}
