import type { Campaign } from "./data/schemas";

export type FundingProgress = {
  /** Arrecadado / meta, arredondado. Pode passar de 100 em campanha batida. */
  percent: number;
  /** Largura da barra, limitada a 100 mesmo quando `percent` passa disso. */
  barPercent: number;
  /** Em centavos, como no schema — formatar só em `lib/format.ts`. */
  raised: number;
  goal: number;
  backers: number;
};

/**
 * Deriva os números da barra de arrecadação. `undefined` = campanha sem meta
 * em dinheiro (evento presencial), e aí a barra não é renderizada.
 *
 * Mora em `lib/` porque as duas rotas de campanha precisam do mesmo cálculo —
 * a listagem mostra a barra em miniatura e o detalhe em tamanho cheio.
 */
export function getFundingProgress(campaign: Campaign): FundingProgress | undefined {
  const funding = campaign.funding;
  if (!funding) {
    return undefined;
  }

  // Meta zerada não deveria existir, mas dividir por ela renderia `Infinity%`.
  const percent =
    funding.goal.amount > 0
      ? Math.round((funding.raised.amount / funding.goal.amount) * 100)
      : 0;

  return {
    percent,
    barPercent: Math.min(percent, 100),
    raised: funding.raised.amount,
    goal: funding.goal.amount,
    backers: funding.backers,
  };
}
