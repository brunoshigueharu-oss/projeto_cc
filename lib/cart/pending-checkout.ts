import { isCartLine, removePurchasedLines, type CartLine } from "./cart-context";

const STORAGE_KEY = "hocus-pocus:pending-checkout";

type PendingCheckout = {
  checkoutId: string;
  lines: CartLine[];
};

function readPendingCheckout(): PendingCheckout | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { checkoutId, lines } = parsed as Record<string, unknown>;
    if (typeof checkoutId !== "string" || !Array.isArray(lines)) return null;
    return { checkoutId, lines: lines.filter(isCartLine) };
  } catch {
    return null;
  }
}

/**
 * Guarda o que está indo para o pagamento, junto do `checkoutId` da Wix.
 * É o que permite, na volta, tirar do carrinho só o que foi comprado — e só
 * quando o pedido confirmado é mesmo deste checkout. Um checkout novo
 * substitui o anterior: só o último pode voltar confirmado.
 *
 * Storage desabilitado ou cheio é ignorado: isto roda com o checkout da Wix
 * já criado, logo antes do redirecionamento, e não pode impedir o pagamento.
 * Sem o registro, a volta só deixa de descontar o carrinho.
 */
export function savePendingCheckout(checkoutId: string, lines: readonly CartLine[]) {
  const pending: PendingCheckout = {
    checkoutId,
    lines: lines.map(({ type, slug, quantity }) => ({ type, slug, quantity })),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // ignora storage desabilitado/cheio
  }
}

/**
 * Concilia o carrinho com um pedido confirmado: desconta as linhas guardadas
 * no início do checkout `checkoutId` e descarta o registro. Devolve `false`
 * sem tocar no carrinho quando não há checkout pendente com esse id — é o
 * caso de reabrir uma confirmação antiga ou já conciliada, o que torna a
 * operação idempotente.
 */
export function reconcilePendingCheckout(checkoutId: string): boolean {
  const pending = readPendingCheckout();
  if (!pending || pending.checkoutId !== checkoutId) return false;
  // Remove o registro antes de mexer no carrinho: se algo falhar no meio, o
  // pior caso é sobrar item no carrinho, nunca descontar duas vezes.
  window.localStorage.removeItem(STORAGE_KEY);
  removePurchasedLines(pending.lines);
  return true;
}
