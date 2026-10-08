"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const control = "absolute z-10 flex size-11 items-center justify-center rounded-full border border-white/24 bg-white/8 text-white backdrop-blur-[10px] hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

type Props = {
  images: { src: string; alt: string }[];
  initialIndex: number;
  getThumbnail: (index: number) => HTMLButtonElement | null;
  revealThumbnail: (index: number) => void;
  onClose: () => void;
};

function fitFrame(frame: HTMLDivElement, image: HTMLImageElement | null | undefined) {
  const ratio = image?.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : 3 / 4;
  const maxWidth = Math.max(1, window.innerWidth - (window.innerWidth >= 640 ? 160 : 112));
  const maxHeight = Math.max(1, window.innerHeight - 144);
  const width = Math.min(maxWidth, maxHeight * ratio);
  Object.assign(frame.style, {
    width: `${width}px`, height: `${width / ratio}px`,
    left: `${(window.innerWidth - width) / 2}px`, top: `${(window.innerHeight - width / ratio) / 2}px`,
  });
}

/** Native modality keeps the background inert and focus inside the viewer. */
export function GalleryLightbox({ images, initialIndex, getThumbnail, revealThumbnail, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  const initialThumbnail = useRef(getThumbnail(initialIndex));

  function thumbnailBounds(thumbnail: HTMLButtonElement) {
    const small = (thumbnail.querySelector("img") ?? thumbnail).getBoundingClientRect();
    return { left: `${small.left}px`, top: `${small.top}px`, width: `${small.width}px`, height: `${small.height}px` };
  }

  useLayoutEffect(() => {
    const layout = () => {
      fitFrame(frameRef.current!, getThumbnail(index)?.querySelector("img"));
    };
    layout();
    window.addEventListener("resize", layout);
    return () => window.removeEventListener("resize", layout);
  }, [index, getThumbnail]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const frame = frameRef.current!;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    dialog.showModal();
    const thumbnail = initialThumbnail.current;
    if (thumbnail && !prefersReducedMotion()) {
      animation.current = frame.animate(
        [thumbnailBounds(thumbnail), { left: frame.style.left, top: frame.style.top, width: frame.style.width, height: frame.style.height }],
        { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finishMotion = () => { if (media.matches) animation.current?.finish(); };
    media.addEventListener("change", finishMotion);
    return () => {
      media.removeEventListener("change", finishMotion);
      animation.current?.cancel();
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, []);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    animation.current?.cancel();
    revealThumbnail(index);
    // The carousel jump is synchronous; wait one paint for its final geometry.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (!dialogRef.current?.isConnected) return;
    const thumbnail = getThumbnail(index);
    if (thumbnail && frameRef.current && !prefersReducedMotion()) {
      animation.current = frameRef.current.animate(
        [{ left: frameRef.current.style.left, top: frameRef.current.style.top, width: frameRef.current.style.width, height: frameRef.current.style.height }, thumbnailBounds(thumbnail)],
        { duration: 230, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
      );
      await animation.current.finished.catch(() => {});
    }
    if (!dialogRef.current?.isConnected) return;
    dialogRef.current.close();
    thumbnail?.focus({ preventScroll: true });
    onClose();
  }

  function navigate(delta: number) {
    if (closing.current) return;
    animation.current?.cancel();
    setIndex((current) => (current + delta + images.length) % images.length);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Galeria de imagens"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/90 p-0 text-white backdrop:bg-transparent"
      onCancel={(event) => { event.preventDefault(); void close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) void close(); }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <button autoFocus type="button" aria-label="Fechar galeria" onClick={() => void close()} className={`${control} right-4 top-4`}><X aria-hidden="true" className="size-6" /></button>
      {images.length > 1 ? <>
        <button type="button" aria-label="Imagem anterior" onClick={() => navigate(-1)} className={`${control} left-2 top-1/2 -translate-y-1/2 sm:left-6`}><ChevronLeft aria-hidden="true" /></button>
        <button type="button" aria-label="Próxima imagem" onClick={() => navigate(1)} className={`${control} right-2 top-1/2 -translate-y-1/2 sm:right-6`}><ChevronRight aria-hidden="true" /></button>
      </> : null}
      <div ref={frameRef} className="absolute overflow-hidden">
        <Image src={images[index].src} alt={images[index].alt} fill sizes="90vw" onLoad={(event) => { if (frameRef.current && !closing.current) fitFrame(frameRef.current, event.currentTarget); }} className="object-cover" />
      </div>
      <p aria-live="polite" aria-atomic="true" className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm">{index + 1} / {images.length} · {images[index].alt}</p>
    </dialog>
  );
}
