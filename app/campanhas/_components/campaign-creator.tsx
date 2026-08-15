import type { Book, Tone } from "@/lib/data/schemas";
import { TONE_BACKGROUND_SOFT, TONE_TEXT } from "@/lib/tone";
import { cn } from "@/lib/utils";

/**
 * "O criador" (node 211:1456 do Figma): retrato redondo + bio do autor.
 *
 * O autor sai do título principal da campanha — `books.ts` já guarda nome e
 * bio. Nenhum autor cadastrado tem foto ainda, então o retrato cai num
 * placeholder: círculo lavado na cor do universo com as iniciais no mesmo tom.
 * A seção inteira some quando o autor não tem bio recebida.
 */
export function CampaignCreator({
  primaryBook,
  tone,
}: {
  primaryBook: Book | undefined;
  tone: Tone;
}) {
  if (!primaryBook?.author.bio) {
    return null;
  }

  const { name, bio } = primaryBook.author;

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 md:flex-row md:items-center md:gap-12">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-32 shrink-0 items-center justify-center rounded-full font-display text-3xl sm:size-40",
            TONE_BACKGROUND_SOFT[tone],
            TONE_TEXT[tone],
          )}
        >
          {getInitials(name)}
        </div>

        <div className="flex-1">
          <p className="font-display text-sm font-bold uppercase tracking-[0.11em] text-primary">
            O criador
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-[28px]">
            {name}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{bio}</p>
        </div>
      </div>
    </section>
  );
}

/** Duas iniciais no máximo — "Mazzitielli e Alcatena" viraria "MEA" sem o corte. */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
