import "server-only";

export type WixOrderListItem = {
  id: string;
  number: number;
  createdDate: string;
  buyerEmail: string;
  totalFormatted: string;
  paymentStatusLabel: string;
  fulfillmentStatusLabel: string;
  orderStatusLabel: string | null;
};

export type WixOrderLineItem = {
  id: string;
  name: string;
  quantity: number;
  priceFormatted: string;
};

export type WixOrderAddress = {
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  addressLine2: string;
  city: string;
  subdivision: string;
  postalCode: string;
  country: string;
};

export type WixOrderDetail = WixOrderListItem & {
  lineItems: WixOrderLineItem[];
  shippingAddress: WixOrderAddress | null;
  priceSummary: {
    subtotalFormatted: string;
    shippingFormatted: string;
    taxFormatted: string;
    totalFormatted: string;
  };
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  NOT_PAID: "Não pago",
  PENDING: "Pagamento pendente",
  PARTIALLY_PAID: "Parcialmente pago",
  PARTIALLY_REFUNDED: "Parcialmente reembolsado",
  FULLY_REFUNDED: "Reembolsado",
  PENDING_MERCHANT: "Aguardando confirmação",
  CANCELED: "Pagamento cancelado",
  DECLINED: "Pagamento recusado",
};

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  FULFILLED: "Entregue",
  NOT_FULFILLED: "Pendente",
  PARTIALLY_FULFILLED: "Parcialmente entregue",
};

/** Só CANCELED/REJECTED viram badge — o resto (APPROVED, PENDING,
 * INITIALIZED) é fluxo normal e não precisa de destaque visual. */
const ORDER_STATUS_LABELS: Record<string, string> = {
  CANCELED: "Cancelado",
  REJECTED: "Rejeitado",
};

export function translatePaymentStatus(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function translateFulfillmentStatus(status: string): string {
  return FULFILLMENT_STATUS_LABELS[status] ?? status;
}

export function translateOrderStatus(status: string): string | null {
  return ORDER_STATUS_LABELS[status] ?? null;
}
