import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { getCampaigns } from "./_data-access/get-campaigns";
import { CampaignCard } from "./_components/campaign-card";

export const metadata: Metadata = {
  title: "Campanhas",
  description:
    "Pré-vendas, assinaturas e encontros da Hocus Pocus — cada tiragem tem sua própria janela.",
};

export default async function CampanhasPage() {
  const entries = await getCampaigns();
  const openCount = entries.filter(
    (entry) => entry.campaign.status !== "encerrada",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Campanhas"
        title="Toda tiragem tem uma janela."
        intro="Pré-vendas com brinde, assinaturas por temporada e encontros presenciais. Quando fecha, fecha — não há reimpressão automática."
      >
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {openCount} em andamento · {entries.length} no histórico
        </p>
      </PageHeader>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <ul className="flex flex-col gap-6">
          {entries.map((entry) => (
            <li key={entry.campaign.slug}>
              <CampaignCard {...entry} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
