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
 * em vez de `auth`. `thankYouPageUrl` recebe `?orderId=` só quando o
 * pagamento é concluído; `postFlowUrl` é o fallback se for abandonado. */
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

/**
 * Orquestra o checkout completo — limpar o carrinho Wix, recriar a partir das
 * linhas compráveis, criar o checkout e redirecionar pro pagamento. Único
 * ponto que conhece essa sequência (antes vivia espalhada em
 * `checkout-content.tsx`, sem teste da ordem das chamadas nem do que
 * acontece se uma etapa falhar no meio). Caminho feliz não retorna —
 * `redirectToCheckoutPayment` já navegou o browser.
 */
export async function startWixCheckout(
  lines: readonly WixLineItemInput[],
  shippingAddress: WixAddress,
  callbacks: { thankYouPageUrl: string; postFlowUrl: string },
): Promise<void> {
  await clearCurrentCart();
  await addLineItemsToCart(lines);
  const checkoutId = await createCheckoutFromCart(shippingAddress);
  await redirectToCheckoutPayment(checkoutId, callbacks);
}
