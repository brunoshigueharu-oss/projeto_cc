import Link from "next/link";

import type { Campaign } from "@/lib/data/schemas";
import { formatDate, formatDateRange, formatPrice } from "@/lib/format";
import { getFundingProgress } from "@/lib/funding";
import { CampaignCountdown } from "./campaign-countdown";

/**
 * Barra de arrecadação + CTA (node 211:1411 do Figma).
 *
 * Duas partes independentes: o bloco de números só aparece quando a campanha
 * tem `funding` (evento e assinatura sem meta caem direto no CTA), e o prazo
 * só aparece quando há `endsAt`.
 *
 * O bloco segue o desenho do site antigo: barra em pílula com a porcentagem
 * solta à direita, meta e prazo na linha de baixo e o CTA centralizado em
 * largura contida. A barra usa creme + vinho lavado da marca, não o preto do
 * texto — em blocos desse tamanho o contraste cheio virava o assunto da página.
 */
export function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const progress = getFundingProgress(campaign);
  const isClosed = campaign.status === "encerrada";

  return (
    <section
      aria-label="Situação da campanha"
      className="border-b border-border bg-card"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
        {progress ? (
          <>
            <div>
              <p className="font-display text-4xl font-extrabold leading-none text-foreground tabular-nums sm:text-5xl lg:text-[56px]">
                {formatPrice(progress.raised)}
              </p>
              <p className="mt-2 text-base text-muted-foreground">
                Apoiados por{" "}
                <strong className="font-bold text-foreground tabular-nums">
                  {progress.backers}
                </strong>{" "}
                pessoas extraordinárias!
              </p>
            </div>

            {/* Porcentagem ao lado da barra, como no site antigo — dentro de um
                selo ela competia com o valor arrecadado logo acima. */}
            <div className="flex items-center gap-5">
              {/* `<progress>` nativo é inconsistente entre navegadores para
                  estilizar, então o papel ARIA carrega a semântica — e o
                  número ao lado, que repete o mesmo valor, fica escondido do
                  leitor de tela para não ser anunciado duas vezes. */}
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress.barPercent}
                aria-label={`${progress.percent}% da meta alcançada`}
                className="h-10 flex-1 overflow-hidden rounded-full bg-muted sm:h-14"
              >
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${progress.barPercent}%` }}
                />
              </div>

              <p
                aria-hidden="true"
                className="shrink-0 font-display text-3xl font-bold text-muted-foreground tabular-nums sm:text-4xl"
              >
                {progress.percent}%
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm font-bold uppercase tracking-[0.08em] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground tabular-nums">
                Meta: {formatPrice(progress.goal)}
              </p>
              <p className="text-foreground">
                <Deadline campaign={campaign} isClosed={isClosed} />
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2 text-sm font-bold uppercase tracking-[0.08em] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              {formatDateRange(campaign.startsAt, campaign.endsAt)}
            </p>
            <p className="text-foreground">
              <Deadline campaign={campaign} isClosed={isClosed} />
            </p>
          </div>
        )}

        {isClosed ? (
          <p className="mx-auto w-full max-w-3xl rounded-lg border border-border px-6 py-3.5 text-center font-display text-sm uppercase tracking-[0.12em] text-muted-foreground">
            Campanha encerrada
          </p>
        ) : (
          <Link
            href={campaign.ctaHref}
            className="mx-auto w-full max-w-3xl rounded-lg border border-border px-6 py-3.5 text-center font-display text-sm uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground hover:bg-secondary"
          >
            {campaign.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

/** Prazo restante: contador vivo quando há data de fim, senão a data de abertura. */
function Deadline({
  campaign,
  isClosed,
}: {
  campaign: Campaign;
  isClosed: boolean;
}) {
  if (!campaign.endsAt) {
    return <>Sem data de encerramento</>;
  }

  if (isClosed) {
    return <>Encerrada em {formatDate(campaign.endsAt)}</>;
  }

  return (
    <CampaignCountdown
      startsAt={campaign.startsAt}
      endsAt={campaign.endsAt}
      fallback={`Até ${formatDate(campaign.endsAt)}`}
    />
  );
}
