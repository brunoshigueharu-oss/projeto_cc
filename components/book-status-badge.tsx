import { Badge } from "@/components/ui/badge";
import type { Book, Locale } from "@/lib/data/schemas";

const STATUS_LABEL: Record<Locale, Record<Book["status"], string>> = {
  pt: {
    disponivel: "Disponível",
    "pre-venda": "Pré-venda",
    esgotado: "Esgotado",
  },
  en: {
    disponivel: "Available",
    "pre-venda": "Pre-order",
    esgotado: "Sold out",
  },
};

const STATUS_VARIANT: Record<Book["status"], "secondary" | "default" | "outline"> = {
  disponivel: "secondary",
  "pre-venda": "default",
  esgotado: "outline",
};

export function BookStatusBadge({
  status,
  locale = "pt",
}: {
  status: Book["status"];
  locale?: Locale;
}) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[locale][status]}</Badge>;
}

export { STATUS_LABEL };
