// lib/wix/ecom.ts
// Cliente REST do eCommerce da Wix (carrinho + checkout) — client-only, mesmo
// padrão de lib/wix/members-auth.ts: usa o token do visitante/membro atual
// (via wixApiRequest/localStorage), então roda só no browser. Nunca chamar a
// partir de Server Action/Route Handler.
import { wixApiRequest, wixErrorStatus } from "./client";
import { WIX_STORES_APP_ID } from "./config";

export type WixLineItemInput = { catalogItemId: string; quantity: number };

/** Shape de `EcommercePlatformCommonAddressInput` da Wix — ver
 * app/(site)/checkout/_lib/to-wix-address.ts para o mapeamento a partir do
 * formulário BR. Sem campo de bairro/complemento dedicado: vão em `addressLine2`. */
export type WixAddress = {
  country: string; // ISO-3166 alpha-2 ("BR")
  countryFullname?: string;
  subdivision: string; // ISO 3166-2 ("BR-SP")
  city: string;
  postalCode: string;
  streetAddress: { name: string; number: string };
  addressLine2?: string;
};

/** Apaga o carrinho "current" do visitante/membro antes de recriar do zero a
 * partir do carrinho local — evita somar quantidade de uma tentativa de
 * checkout anterior abandonada. 404 (ainda sem carrinho) é esperado. */
export async function clearCurrentCart(): Promise<void> {
  try {
    await wixApiRequest("/ecom/v1/carts/current", { method: "DELETE" });
  } catch (e) {
    if (wixErrorStatus(e) !== 404) throw e;
  }
}

export async function addLineItemsToCart(items: readonly WixLineItemInput[]): Promise<void> {
  if (items.length === 0) {
    throw new Error("Nenhum item disponível para compra nesta lista.");
  }
  await wixApiRequest("/ecom/v1/carts/current/add-to-cart", {
    body: {
      lineItems: items.map(({ catalogItemId, quantity }) => ({
        catalogReference: { appId: WIX_STORES_APP_ID, catalogItemId },
        quantity,
      })),
    },
  });
}

export async function createCheckoutFromCart(shippingAddress: WixAddress): Promise<string> {
  const res = await wixApiRequest("/ecom/v1/carts/current/create-checkout", {
    body: { channelType: "WEB", shippingAddress },
  });
  const checkoutId: string | undefined = res?.checkoutId;
  if (!checkoutId) throw new Error("Wix não retornou checkoutId ao criar o checkout.");
  return checkoutId;
}

/** Redireciona o browser pra página de pagamento hospedada pela Wix — mesma
 * Redirect Session API de lib/wix/members-auth.ts, com payload `ecomCheckout`
 * em vez de `auth`. `thankYouPageUrl` recebe `?orderId=` quando o
 * pagamento é concluído; `postFlowUrl` é o fallback se for abandonado. O
 * `orderId` da URL não é prova de pagamento — confirme com `getPlacedOrder`. */
export async function redirectToCheckoutPayment(
  checkoutId: string,
  callbacks: { thankYouPageUrl: string; postFlowUrl: string },
): Promise<void> {
  const { redirectSession } = await wixApiRequest("/_api/redirects-api/v1/redirect-session", {
    body: { ecomCheckout: { checkoutId }, callbacks },
  });
  const fullUrl: string | undefined = redirectSession?.fullUrl;
  if (!fullUrl) throw new Error("Wix não retornou a URL de pagamento.");
  window.location.href = fullUrl;
}

/** O que a confirmação precisa saber de um pedido — recorte de `Order` da Wix
 * (GET /ecom/v1/orders/{id}). `checkoutId` liga o pedido ao checkout que o
 * originou; `status` diz se ele foi aprovado. */
export type WixPlacedOrder = {
  checkoutId: string | undefined;
  /** Número exibido ao comprador e no painel da loja. */
  number: string | undefined;
  status: "INITIALIZED" | "APPROVED" | "CANCELED" | "PENDING" | "REJECTED" | undefined;
};

/** Status HTTP com que a Wix responde por um pedido que não existe ou não é
 * de quem está perguntando. */
const ORDER_NOT_ACCESSIBLE_STATUSES = [400, 403, 404];

/**
 * Busca um pedido com a identidade do visitante/membro atual. A Wix só
 * devolve o pedido a quem o fez — por isso um `orderId` copiado, inventado ou
 * de outra pessoa resulta em `null`, e não em confirmação. Outros erros
 * (rede, 5xx) são propagados: não saber não é o mesmo que "não existe". O
 * mesmo vale para resposta sem corpo — é o que `wixApiRequest` devolve num
 * 402, em vez de lançar.
 */
export async function getPlacedOrder(orderId: string): Promise<WixPlacedOrder | null> {
  let res;
  try {
    res = await wixApiRequest(`/ecom/v1/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  } catch (e) {
    const status = wixErrorStatus(e);
    if (status !== undefined && ORDER_NOT_ACCESSIBLE_STATUSES.includes(status)) return null;
    throw e;
  }
  if (res === undefined) throw new Error("Wix não devolveu o pedido.");
  const order = res.order;
  if (!order) return null;
  return {
    checkoutId: order.checkoutId,
    number: order.number === undefined ? undefined : String(order.number),
    status: order.status,
  };
}

/**
 * Orquestra o checkout completo — limpar o carrinho Wix, recriar a partir das
 * linhas compráveis, criar o checkout e redirecionar pro pagamento. Único
 * ponto que conhece essa sequência (antes vivia espalhada em
 * `checkout-content.tsx`, sem teste da ordem das chamadas nem do que
 * acontece se uma etapa falhar no meio). Caminho feliz não retorna —
 * `redirectToCheckoutPayment` já navegou o browser.
 *
 * `onCheckoutCreated` recebe o `checkoutId` antes do redirecionamento: é a
 * última chance de guardar algo neste documento (ver
 * `lib/cart/pending-checkout.ts`).
 */
export async function startWixCheckout(
  lines: readonly WixLineItemInput[],
  shippingAddress: WixAddress,
  callbacks: { thankYouPageUrl: string; postFlowUrl: string },
  onCheckoutCreated?: (checkoutId: string) => void,
): Promise<void> {
  await clearCurrentCart();
  await addLineItemsToCart(lines);
  const checkoutId = await createCheckoutFromCart(shippingAddress);
  onCheckoutCreated?.(checkoutId);
  await redirectToCheckoutPayment(checkoutId, callbacks);
}
