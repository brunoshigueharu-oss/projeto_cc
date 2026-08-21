"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import { isPurchasable } from "@/lib/data/book-availability";
import { BOOKS_BY_SLUG } from "@/lib/data/books";
import { COMBOS } from "@/lib/data/combos";

export type CartItemType = "book" | "combo";

export type CartLine = {
  type: CartItemType;
  slug: string;
  quantity: number;
};

export type ResolvedCartLine = CartLine & {
  title: string;
  unitPriceCents: number;
  available: boolean;
};

type CartContextValue = {
  resolvedLines: readonly ResolvedCartLine[];
  itemCount: number;
  subtotalCents: number;
  addItem: (type: CartItemType, slug: string, quantity?: number) => void;
  removeItem: (type: CartItemType, slug: string) => void;
  setQuantity: (type: CartItemType, slug: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "hocus-pocus:cart";
const EMPTY_LINES: readonly CartLine[] = [];
const CART_EVENT = "hocus-pocus:cart-change";
const cartEmitter = typeof window !== "undefined" ? new EventTarget() : null;

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    (line.type === "book" || line.type === "combo") &&
    typeof line.slug === "string" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function parseLines(raw: string | null): CartLine[] {
  try {
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
  } catch {
    return [];
  }
}

function readLines(): CartLine[] {
  return parseLines(window.localStorage.getItem(STORAGE_KEY));
}

function writeLines(lines: CartLine[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  cartEmitter?.dispatchEvent(new Event(CART_EVENT));
}

// `useSyncExternalStore` exige que `getSnapshot` devolva a MESMA referência
// enquanto os dados não mudarem (senão causa loop de render) — cacheia o
// array parseado e só reparseia quando a string crua do localStorage muda.
let cachedRaw: string | null = null;
let cachedLines: readonly CartLine[] = EMPTY_LINES;

function getSnapshot(): readonly CartLine[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseLines(raw);
  }
  return cachedLines;
}

function getServerSnapshot(): readonly CartLine[] {
  return EMPTY_LINES;
}

function subscribe(callback: () => void) {
  // Evento customizado cobre mudanças feitas nesta mesma aba (addItem etc.);
  // o evento nativo "storage" só dispara em OUTRAS abas do mesmo domínio.
  cartEmitter?.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    cartEmitter?.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Carrinho 100% client-side (localStorage) — só vira `orders` no checkout.
 * Preço/título são resolvidos ao vivo contra o catálogo estático (`lib/data`),
 * nunca persistidos aqui, para nunca divergir do preço real do produto.
 *
 * `useSyncExternalStore` em vez de `useState` + `useEffect`: localStorage é
 * uma fonte de estado externa ao React — sincronizar via esse hook evita
 * setState síncrono dentro de efeito (cascading render) e mantém uma única
 * fonte de verdade entre as mutações e a leitura.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function addItem(type: CartItemType, slug: string, quantity = 1) {
    const current = readLines();
    const existing = current.find((line) => line.type === type && line.slug === slug);
    const next = existing
      ? current.map((line) =>
          line.type === type && line.slug === slug
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      : [...current, { type, slug, quantity }];
    writeLines(next);
  }

  function removeItem(type: CartItemType, slug: string) {
    writeLines(readLines().filter((line) => !(line.type === type && line.slug === slug)));
  }

  function setQuantity(type: CartItemType, slug: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(type, slug);
      return;
    }
    writeLines(
      readLines().map((line) =>
        line.type === type && line.slug === slug ? { ...line, quantity } : line,
      ),
    );
  }

  function clear() {
    writeLines([]);
  }

  const resolvedLines = useMemo<ResolvedCartLine[]>(
    () =>
      lines.flatMap((line): ResolvedCartLine[] => {
        if (line.type === "book") {
          const book = BOOKS_BY_SLUG.get(line.slug);
          if (!book) return [];
          return [
            {
              ...line,
              title: book.title,
              unitPriceCents: book.price.amount,
              available: isPurchasable(book.status),
            },
          ];
        }
        const combo = COMBOS.find((candidate) => candidate.slug === line.slug);
        if (!combo) return [];
        return [
          {
            ...line,
            title: combo.title,
            unitPriceCents: combo.price.amount,
            available: true,
          },
        ];
      }),
    [lines],
  );

  const itemCount = resolvedLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotalCents = resolvedLines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );

  const value: CartContextValue = {
    resolvedLines,
    itemCount,
    subtotalCents,
    addItem,
    removeItem,
    setQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
