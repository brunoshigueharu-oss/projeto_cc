"use client";

import { useLayoutEffect, useRef, useState } from "react";

type BookSynopsisProps = {
  text: string;
};

export function BookSynopsis({ text }: BookSynopsisProps) {
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
          {isExpanded ? "Leia menos" : "Leia mais"}
        </button>
      ) : null}
    </div>
  );
}
