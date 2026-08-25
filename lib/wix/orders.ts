import "server-only";

import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

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

/** Shape bruto que a Wix devolve tanto em SearchOrders quanto em GetOrder —
 * só os campos que este módulo lê. */
type WixApiOrder = {
  id: string;
  number: number;
  createdDate: string;
  buyerInfo?: { email?: string };
  paymentStatus: string;
  fulfillmentStatus: string;
  status: string;
  priceSummary: {
    total: { formattedAmount: string };
    subtotal: { formattedAmount: string };
    shipping: { formattedAmount: string };
    tax: { formattedAmount: string };
  };
  lineItems: Array<{
    id: string;
    productName: { original: string };
    quantity: number;
    price: { formattedAmount: string };
  }>;
  recipientInfo?: {
    address?: {
      streetAddress?: { name: string; number: string };
      addressLine2?: string;
      city: string;
      subdivision: string;
      postalCode: string;
      country: string;
    };
    contactDetails?: { firstName?: string; lastName?: string; phone?: string };
  };
};

/** Lida em cada chamada (não no module scope) para que testes possam
 * stubar `process.env.WIX_ADMIN_API_KEY` por caso — ao contrário de
 * `lib/wix/admin.ts`, que lê a env var uma vez no import. */
function getAdminApiKey(): string {
  const key = process.env.WIX_ADMIN_API_KEY;
  if (!key) {
    throw new Error("WIX_ADMIN_API_KEY não configurada no servidor.");
  }
  return key;
}

async function wixOrdersRequest(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown } = { method: "GET" },
): Promise<Response> {
  return fetch(`${WIX_API_BASE}${path}`, {
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAdminApiKey(),
      "wix-site-id": WIX_METASITE_ID,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

function toOrderListItem(order: WixApiOrder): WixOrderListItem {
  return {
    id: order.id,
    number: order.number,
    createdDate: order.createdDate,
    buyerEmail: order.buyerInfo?.email ?? "—",
    totalFormatted: order.priceSummary.total.formattedAmount,
    paymentStatusLabel: translatePaymentStatus(order.paymentStatus),
    fulfillmentStatusLabel: translateFulfillmentStatus(order.fulfillmentStatus),
    orderStatusLabel: translateOrderStatus(order.status),
  };
}

export async function searchOrders(): Promise<WixOrderListItem[]> {
  const res = await wixOrdersRequest("/ecom/v1/orders/search", {
    method: "POST",
    body: { search: { cursorPaging: { limit: 100 } } },
  });
  if (!res.ok) {
    throw new Error(`Wix Orders search falhou: ${res.status}`);
  }
  const data = await res.json();
  const orders: WixApiOrder[] = data?.orders ?? [];
  return orders.map(toOrderListItem);
}

function toOrderAddress(order: WixApiOrder): WixOrderAddress | null {
  const address = order.recipientInfo?.address;
  if (!address) return null;
  const contact = order.recipientInfo?.contactDetails;
  return {
    recipientName: [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") || "—",
    phone: contact?.phone ?? "",
    street: address.streetAddress?.name ?? "",
    number: address.streetAddress?.number ?? "",
    addressLine2: address.addressLine2 ?? "",
    city: address.city,
    subdivision: address.subdivision,
    postalCode: address.postalCode,
    country: address.country,
  };
}

function toOrderDetail(order: WixApiOrder): WixOrderDetail {
  return {
    ...toOrderListItem(order),
    lineItems: order.lineItems.map((item) => ({
      id: item.id,
      name: item.productName.original,
      quantity: item.quantity,
      priceFormatted: item.price.formattedAmount,
    })),
    shippingAddress: toOrderAddress(order),
    priceSummary: {
      subtotalFormatted: order.priceSummary.subtotal.formattedAmount,
      shippingFormatted: order.priceSummary.shipping.formattedAmount,
      taxFormatted: order.priceSummary.tax.formattedAmount,
      totalFormatted: order.priceSummary.total.formattedAmount,
    },
  };
}

/** 404 vira `null` (ORDER_NOT_FOUND) — quem chama decide o que fazer
 * (a Route Handler da Task 5 devolve 404 pro client). */
export async function getOrder(orderId: string): Promise<WixOrderDetail | null> {
  const res = await wixOrdersRequest(`/ecom/v1/orders/${orderId}`, { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Wix Orders get falhou: ${res.status}`);
  }
  const data = await res.json();
  return toOrderDetail(data.order as WixApiOrder);
}
