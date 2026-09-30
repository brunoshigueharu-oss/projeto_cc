"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

import type { Locale } from "@/lib/data/schemas";

type BookSynopsisProps = {
  text: string;
  locale?: Locale;
};

const LABELS: Record<Locale, { readMore: string; readLess: string }> = {
  pt: { readMore: "Leia mais", readLess: "Leia menos" },
  en: { readMore: "Read more", readLess: "Read less" },
};

export function BookSynopsis({ text, locale = "pt" }: BookSynopsisProps) {
  const labels = LABELS[locale];
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const expandedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const heightsRef = useRef({ collapsed: 0, full: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const paragraph = paragraphRef.current;
    if (!viewport || !paragraph) return;

    const measure = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      const full = paragraph.getBoundingClientRect().height;
      const collapsed = Math.min(full, parseFloat(getComputedStyle(paragraph).lineHeight) * 4);
      heightsRef.current = { collapsed, full };
      setIsTruncated(full > collapsed + 1);
      viewport.style.maxHeight = "none";
      viewport.style.height = `${expandedRef.current ? full : collapsed}px`;
    };

    measure();
    // The paragraph keeps its natural height, even while its viewport is clipped.
    // This also catches font loading and width changes while expanded.
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [text]);

  function toggle() {
    const viewport = viewportRef.current;
    const button = buttonRef.current;
    if (!viewport || !button) return;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

    const expanding = !expandedRef.current;
    const from = viewport.getBoundingClientRect().height;
    const to = expanding ? heightsRef.current.full : heightsRef.current.collapsed;
    // Keep the beginning still when visible; otherwise retain the control the
    // reader just used, compensating for the removed text on each frame.
    const anchorButton = !expanding && viewport.getBoundingClientRect().top < 0;
    const anchorTop = button.getBoundingClientRect().top;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    expandedRef.current = expanding;
    setIsExpanded(expanding);
    const start = performance.now();

    const step = (now: number) => {
      const progress = motion.matches ? 1 : Math.min((now - start) / 180, 1);
      const eased = 1 - (1 - progress) ** 3;
      viewport.style.height = `${from + (to - from) * eased}px`;
      if (anchorButton) {
        window.scrollBy({ top: button.getBoundingClientRect().top - anchorTop, behavior: "instant" });
      }
      frameRef.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    step(start);
  }

  return (
    <div className="mt-4 max-w-xl" style={{ overflowAnchor: "none" }}>
      <div ref={viewportRef} className="max-h-[6.5em] overflow-hidden">
        <p
          id={contentId}
          ref={paragraphRef}
          className="whitespace-pre-line font-serif leading-relaxed text-foreground/70"
        >
          {text}
        </p>
      </div>

      {isTruncated ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          className="mt-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          aria-expanded={isExpanded}
          aria-controls={contentId}
        >
          {isExpanded ? labels.readLess : labels.readMore}
        </button>
      ) : null}
    </div>
  );
}
