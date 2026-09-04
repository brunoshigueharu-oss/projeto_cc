"use client";

import { useCallback, useSyncExternalStore } from "react";

const MS_PER_DAY = 86_400_000;

/**
 * "18 DIAS RESTANTES" (node 211:1422 do Figma), com duas variações: antes de
 * abrir vira "COMEÇA EM N DIAS", depois do prazo vira "PRAZO ENCERRADO".
 *
 * Client Component de propósito, pelo mesmo motivo que `status` é campo
 * explícito no schema em vez de derivado da data: a página é pré-renderizada
 * no `next build`, então um `new Date()` no servidor congelaria o contador no
 * dia do deploy e a campanha ficaria para sempre com o mesmo número de dias.
 *
 * `useSyncExternalStore` é o caminho oficial para valor que só existe no
 * cliente: o snapshot do servidor devolve `null`, então o HTML estático leva
 * `fallback` (o intervalo de datas) — que é também o que continua valendo para
 * quem navega sem JavaScript — e o número real entra na hidratação, sem
 * `setState` dentro de efeito.
 */
export function CampaignCountdown({
  startsAt,
  endsAt,
  fallback,
}: {
  startsAt: string;
  endsAt: string;
  fallback: string;
}) {
  const getSnapshot = useCallback(
    () => getCountdown(startsAt, endsAt),
    [startsAt, endsAt],
  );
  const countdown = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!countdown) {
    return <>{fallback}</>;
  }

  const { phase, days } = parseCountdown(countdown);

  if (phase === "ended") {
    return <>PRAZO ENCERRADO</>;
  }

  const dayNoun = days === 1 ? "DIA" : "DIAS";

  // Antes de abrir, o que interessa é quando começa; depois, quanto falta.
  return phase === "upcoming" ? (
    <>
      COMEÇA EM <span className="font-extrabold tabular-nums">{days}</span>{" "}
      {dayNoun}
    </>
  ) : (
    <>
      <span className="font-extrabold tabular-nums">{days}</span> {dayNoun}{" "}
      {days === 1 ? "RESTANTE" : "RESTANTES"}
    </>
  );
}

type Phase = "upcoming" | "running" | "ended";

/**
 * Snapshot como string ("running:18"), não como objeto.
 *
 * `useSyncExternalStore` compara o snapshot com `Object.is` a cada render: um
 * objeto novo a cada chamada seria sempre "diferente" e entraria em laço
 * infinito. A string é estável enquanto o dia não vira.
 */
function getCountdown(startsAt: string, endsAt: string): string {
  const now = Date.now();
  const opensAt = new Date(`${startsAt}T00:00:00`).getTime();

  if (now < opensAt) {
    return `upcoming:${Math.max(daysBetween(now, opensAt), 1)}`;
  }

  // Fim do dia: uma campanha que fecha hoje ainda tem o dia inteiro.
  const daysLeft = daysBetween(now, new Date(`${endsAt}T23:59:59`).getTime());

  return daysLeft > 0 ? `running:${daysLeft}` : "ended:0";
}

function parseCountdown(snapshot: string): { phase: Phase; days: number } {
  const [phase, days] = snapshot.split(":");
  return {
    phase: phase === "upcoming" || phase === "running" ? phase : "ended",
    days: Number(days),
  };
}

function daysBetween(from: number, to: number): number {
  return Math.ceil((to - from) / MS_PER_DAY);
}

/** O contador é em dias: nada a notificar enquanto a página está aberta. */
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): string | null {
  return null;
}
