import { Badge } from "@/components/ui/badge";
import type { Book } from "@/lib/data/schemas";

const STATUS_LABEL: Record<Book["status"], string> = {
  disponivel: "Disponível",
  "pre-venda": "Pré-venda",
  esgotado: "Esgotado",
};

const STATUS_VARIANT: Record<Book["status"], "secondary" | "default" | "outline"> = {
  disponivel: "secondary",
  "pre-venda": "default",
  esgotado: "outline",
};

export function BookStatusBadge({ status }: { status: Book["status"] }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

export { STATUS_LABEL };
