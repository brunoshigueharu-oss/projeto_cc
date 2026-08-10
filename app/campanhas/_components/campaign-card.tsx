import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Campaign } from "@/lib/data/schemas";
import { formatDateRange } from "@/lib/format";
import { TONE_BACKGROUND } from "@/lib/tone";
import { cn } from "@/lib/utils";
import type { CampaignEntry } from "../_data-access/get-campaigns";

const KIND_LABEL: Record<Campaign["kind"], string> = {
  lancamento: "Lançamento",
  "pre-venda": "Pré-venda",
  evento: "Evento",
  assinatura: "Assinatura",
};

const STATUS_LABEL: Record<Campaign["status"], string> = {
  ativa: "Inscrições abertas",
  "em-breve": "Em breve",
  encerrada: "Encerrada",
};

export function CampaignCard({ campaign, relatedBooks }: CampaignEntry) {
  const isClosed = campaign.status === "encerrada";

  return (
    <article
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8",
        isClosed ? "bg-transparent" : "bg-card",
      )}
    >
      {/* Faixa de cor do universo — âncora visual, sem conteúdo próprio. */}
      <div
        aria-hidden="true"
        className={cn(
          "h-1.5 w-full shrink-0 rounded-full sm:h-32 sm:w-1.5",
          TONE_BACKGROUND[campaign.tone],
          isClosed && "opacity-40",
        )}
      />

      <div className={cn("flex-1", isClosed && "opacity-70")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isClosed ? "outline" : "default"}>
            {KIND_LABEL[campaign.kind]}
          </Badge>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {STATUS_LABEL[campaign.status]}
          </span>
        </div>

        <h3 className="mt-4 font-display text-2xl leading-tight text-foreground">
          {campaign.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{campaign.kicker}</p>

        <p className="mt-4 max-w-prose font-serif leading-relaxed text-foreground/80">
          {campaign.description}
        </p>

        <p className="mt-5 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground tabular-nums">
          {formatDateRange(campaign.startsAt, campaign.endsAt)}
        </p>

        {relatedBooks.length > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Títulos:{" "}
            {relatedBooks.map((book, index) => (
              <span key={book.slug}>
                {index > 0 ? ", " : ""}
                <Link
                  href={`/catalogo/${book.slug}`}
                  className="text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {book.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}

        {isClosed ? null : (
          <Link
            href={campaign.ctaHref}
            className="mt-6 inline-flex text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
          >
            {campaign.ctaLabel} →
          </Link>
        )}
      </div>
    </article>
  );
}
