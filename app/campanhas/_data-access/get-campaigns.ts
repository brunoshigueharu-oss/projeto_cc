import { BOOKS_BY_SLUG } from "@/lib/data/books";
import { CAMPAIGNS } from "@/lib/data/campaigns";
import type { Book, Campaign } from "@/lib/data/schemas";

export type CampaignEntry = {
  campaign: Campaign;
  relatedBooks: readonly Book[];
};

const STATUS_ORDER: Record<Campaign["status"], number> = {
  ativa: 0,
  "em-breve": 1,
  encerrada: 2,
};

export async function getCampaigns(): Promise<readonly CampaignEntry[]> {
  return CAMPAIGNS.map((campaign) => ({
    campaign,
    relatedBooks: campaign.relatedBookSlugs.flatMap((slug) => {
      const book = BOOKS_BY_SLUG.get(slug);
      return book ? [book] : [];
    }),
  })).sort(
    (a, b) =>
      STATUS_ORDER[a.campaign.status] - STATUS_ORDER[b.campaign.status],
  );
}
