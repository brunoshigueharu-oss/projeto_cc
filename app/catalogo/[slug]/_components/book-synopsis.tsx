"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph) return;
    setIsTruncated(paragraph.scrollHeight > paragraph.clientHeight + 1);
  }, [text]);

  return (
    <div className="mt-4 max-w-xl">
      <p
        ref={paragraphRef}
        className={
          isExpanded
            ? "whitespace-pre-line font-serif leading-relaxed text-foreground/70"
            : "line-clamp-4 whitespace-pre-line font-serif leading-relaxed text-foreground/70"
        }
      >
        {text}
      </p>

      {isTruncated ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          aria-expanded={isExpanded}
        >
          {isExpanded ? labels.readLess : labels.readMore}
        </button>
      ) : null}
    </div>
  );
}
