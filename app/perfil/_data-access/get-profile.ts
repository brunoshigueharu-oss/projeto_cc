import { BOOKS_BY_SLUG } from "@/lib/data/books";
import type { Book } from "@/lib/data/schemas";

/**
 * MAQUETE DE INTERFACE — dados fictícios, sem autenticação.
 *
 * Quando entrar login de verdade (Supabase, conforme o CLAUDE.md), este é o
 * único arquivo a mudar: a assinatura das funções já é async e já devolve os
 * tipos finais, então nenhum componente precisa ser reescrito.
 */

export type Profile = {
  name: string;
  email: string;
  memberSince: string;
  plan: string;
};

export type Order = {
  id: string;
  placedAt: string;
  total: number;
  status: "entregue" | "em-transito" | "processando";
  bookSlugs: readonly string[];
};

const PROFILE: Profile = {
  name: "Marina Alcântara",
  email: "marina.alcantara@exemplo.com",
  memberSince: "2024-03-18",
  plan: "Assinatura Contos Noturnos",
};

const ORDERS: readonly Order[] = [
  {
    id: "HP-2026-0184",
    placedAt: "2026-02-09",
    total: 12900,
    status: "em-transito",
    bookSlugs: ["os-contos-do-planta-1"],
  },
  {
    id: "HP-2025-1129",
    placedAt: "2025-11-22",
    total: 20800,
    status: "entregue",
    bookSlugs: ["os-contos-do-planta-caixa-de-reliquias", "necroplanta"],
  },
  {
    id: "HP-2025-0733",
    placedAt: "2025-08-17",
    total: 8900,
    status: "entregue",
    bookSlugs: ["yanayag"],
  },
];

const SHELF_SLUGS = [
  "os-contos-do-planta-1",
  "os-contos-do-planta-caixa-de-reliquias",
  "necroplanta",
  "yanayag",
];

export async function getProfile(): Promise<Profile> {
  return PROFILE;
}

export async function getOrders(): Promise<readonly Order[]> {
  return ORDERS;
}

export async function getShelf(): Promise<readonly Book[]> {
  return SHELF_SLUGS.flatMap((slug) => {
    const book = BOOKS_BY_SLUG.get(slug);
    return book ? [book] : [];
  });
}
