import type { Tone } from "@/lib/data/schemas";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Seal } from "./seal";

type BookCoverProps = {
  title: string;
  tone: Tone;
  /** Descrição da capa real — vira o rótulo acessível do placeholder. */
  alt: string;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Capa em CSS puro, no lugar de uma imagem.
 *
 * A editora ainda não forneceu os arquivos das capas, então este placeholder
 * mantém a linguagem visual (painel tonalizado, moldura interna, selo) sem
 * depender de asset nem exigir `remotePatterns` no next.config. Ao trocar por
 * imagem real, este é o único arquivo a mudar.
 */
export function BookCover({ title, tone, alt, size = "sm", className }: BookCoverProps) {
  const isLarge = size === "lg";

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative aspect-3/4 overflow-hidden rounded-lg border border-border shadow-sm",
        TONE_BACKGROUND[tone],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute rounded border border-white/15",
          isLarge ? "inset-5" : "inset-3",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute flex items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm",
          isLarge ? "right-5 top-5 size-12" : "right-3 top-3 size-9",
        )}
      >
        <Seal className={isLarge ? "size-7" : "size-5"} />
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "absolute font-display leading-tight text-white",
          isLarge ? "inset-x-6 bottom-6 text-3xl" : "inset-x-4 bottom-4 text-lg",
        )}
      >
        {title}
      </span>
    </div>
  );
}
