import Link from "next/link";

import type { Campaign } from "@/lib/data/schemas";
import { formatDate, formatDateRange, formatPrice } from "@/lib/format";
import { getFundingProgress } from "@/lib/funding";
import { CampaignCountdown } from "./campaign-countdown";

/**
 * Barra de arrecadação + CTA (node 211:1411 do Figma, diagramação revisada
 * a partir de referência visual do usuário).
 *
 * Duas partes independentes: o bloco de números só aparece quando a campanha
 * tem `funding` (evento e assinatura sem meta caem direto no CTA), e o prazo
 * só aparece quando há `endsAt`.
 *
 * Tudo — valor arrecadado, barra, meta/prazo e CTA — vive numa coluna
 * centralizada e mais estreita (`max-w-3xl`) que o container da seção, e
 * cada linha ocupa a largura cheia dessa coluna (`w-full`) para não ficar
 * desalinhada com o botão abaixo. A barra é fina (estilo Apple, não o bloco
 * grosso da v1), mas com um pouco mais de altura que a primeira revisão —
 * fina demais sumia visualmente. A porcentagem vem depois dela, não ao
 * lado — colocar os dois na mesma linha forçava a barra a encolher para
 * abrir espaço pro número. O trilho usa `foreground/10` (cinza neutro) em
 * vez de `muted` (que puxa pro creme da marca e lia como "amarelado" numa
 * área tão grande). O preenchimento usa `accent`, o dourado documentado no
 * brandbook. Textos de apoio usam opacidade sobre `foreground` em vez de
 * `muted-foreground`: o token tem um viés quente que aqui devia ficar
 * neutro.
 *
 * Na linha meta/prazo, o peso da fonte é assimétrico de propósito: "Meta"
 * é `font-bold` e o prazo (dias restantes / data) é `font-medium` — sem
 * isso, os dois em bold com o prazo alinhado à direita (assim como o "%"
 * abaixo da barra) deixava o layout visualmente pesado pro lado direito.
 */
export function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const progress = getFundingProgress(campaign);
  const isClosed = campaign.status === "encerrada";

  return (
    <section
      aria-label="Situação da campanha"
      className="border-b border-border bg-card"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
          {progress ? (
            <>
              <div>
                <p className="font-display text-4xl font-extrabold leading-none text-foreground tabular-nums sm:text-5xl lg:text-[56px]">
                  {formatPrice(progress.raised)}
                </p>
                <p className="mt-2 text-base text-foreground/60">
                  Apoiados por{" "}
                  <strong className="font-bold text-foreground tabular-nums">
                    {progress.backers}
                  </strong>{" "}
                  pessoas extraordinárias!
                </p>
              </div>

              <div className="w-full">
                {/* `<progress>` nativo é inconsistente entre navegadores para
                    estilizar, então o papel ARIA carrega a semântica — e o
                    número abaixo, que repete o mesmo valor, fica escondido do
                    leitor de tela para não ser anunciado duas vezes. */}
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.barPercent}
                  aria-label={`${progress.percent}% da meta alcançada`}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/10 sm:h-3"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${progress.barPercent}%` }}
                  />
                </div>

                <p
                  aria-hidden="true"
                  className="mt-2 text-right text-sm font-medium text-foreground/50 tabular-nums"
                >
                  {progress.percent}%
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 text-sm uppercase tracking-[0.08em] sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-foreground tabular-nums">
                  Meta: {formatPrice(progress.goal)}
                </p>
                <p className="font-medium text-foreground/60">
                  <Deadline campaign={campaign} isClosed={isClosed} />
                </p>
              </div>
            </>
          ) : (
            <div className="flex w-full flex-col gap-2 text-sm uppercase tracking-[0.08em] sm:flex-row sm:items-center sm:justify-between">
              <p className="font-bold text-foreground">
                {formatDateRange(campaign.startsAt, campaign.endsAt)}
              </p>
              <p className="font-medium text-foreground/60">
                <Deadline campaign={campaign} isClosed={isClosed} />
              </p>
            </div>
          )}

          {isClosed ? (
            <p className="w-full rounded-lg border border-border px-6 py-3.5 text-center font-display text-sm uppercase tracking-[0.12em] text-foreground/60">
              Campanha encerrada
            </p>
          ) : (
            <Link
              href={campaign.ctaHref}
              className="w-full rounded-lg border border-border px-6 py-3.5 text-center font-display text-sm uppercase tracking-[0.12em] text-foreground transition-colors hover:border-foreground hover:bg-secondary"
            >
              {campaign.ctaLabel}
            </Link>
          )}
        </div>
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
