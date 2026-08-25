# Admin de pedidos via Wix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Religar `/admin/pedidos` e `/admin/pedidos/[id]` a dados reais do Wix Stores, substituindo o `<MaintenanceNotice>` atual — leitura apenas, sem paginação, sem dashboard de métricas.

**Architecture:** `lib/wix/orders.ts` (server-only) busca e traduz pedidos com a Wix Admin API Key, seguindo o mesmo padrão de `lib/wix/admin.ts`. Duas novas Route Handlers (`app/api/admin/orders/route.ts` e `.../[id]/route.ts`) replicam a checagem dupla (`resolveMemberFromRequest` + `isAdminEmail`) já usada em `/api/admin/check`. As páginas viram Client Components dentro do `<AdminGate>` existente, buscando dos dois endpoints só depois do gate confirmar admin — nenhum dado de pedido é renderizado no servidor sem essa checagem.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest (mock de `fetch` global), Tailwind + shadcn (`Badge`).

**Spec:** `docs/superpowers/specs/2026-08-24-admin-orders-wix-design.md`

## Global Constraints

- NEVER usar `any` explícito — usar `unknown` + type guard.
- Server Components por padrão — exceção documentada na spec: as duas páginas desta feature são Client Components porque não há sessão server-legível (token do membro só existe em `localStorage`).
- Tailwind only — sem CSS inline, sem styled-components.
- `lib/format.ts` é `server-only` — não pode ser importado dos Client Components desta feature; datas são formatadas com um helper client-safe dedicado (Task 6).
- ALWAYS rodar `npm run type-check && npm run lint` após uma série de mudanças.
- Rodar um teste por vez, não o suite completo: `npm run test -- orders`.
- Ao criar rotas novas (`[id]/route.ts`, `[id]/page.tsx`), rodar `npm run dev` uma vez (ou `Ctrl+C` após alguns segundos) antes do `type-check` — `RouteContext`/`PageProps` são gerados em `.next/dev/types/` a partir das rotas existentes.
- Nomes de arquivo: kebab-case. Componentes: PascalCase.
- Commits em inglês, imperativo.

---

## Contexto técnico confirmado (não está na spec de design, mas o plano depende disso)

Consultei a documentação oficial da Wix eCommerce Orders API (`GetOrder` e `SearchOrders`) para fechar os nomes de campo exatos:

- `GET /ecom/v1/orders/{id}` e `POST /ecom/v1/orders/search` — ambos autenticados com a Admin API Key (header `Authorization`) + `wix-site-id`.
- `SearchOrders` body é **aninhado sob `search`**: `{ "search": { "cursorPaging": { "limit": 100 } } }` — não `{ "cursorPaging": {...} }` solto.
- Resposta de ambos os endpoints usa o mesmo objeto `Order`: `id`, `number` (tipo `number`, não string), `createdDate` (ISO), `buyerInfo.email`, `paymentStatus`, `fulfillmentStatus`, `status`, `priceSummary.{subtotal,shipping,tax,total}.formattedAmount`, `lineItems[].{id, productName.original, quantity, price.formattedAmount}`, `recipientInfo.{address: {streetAddress:{name,number}, addressLine2, city, subdivision, postalCode, country}, contactDetails: {firstName, lastName, phone}}`.
- Erro 404 do `GetOrder` é HTTP 404 puro — suficiente checar `res.status === 404`, sem precisar parsear o `applicationCode`.
- `SearchOrders` sem filtro já exclui por padrão pedidos com `status: PENDING/REJECTED/INITIALIZED` (comportamento da própria API) — nada a fazer aqui.

---

### Task 1: Tipos e tradução de status puros

**Files:**
- Create: `lib/wix/orders.ts`
- Test: `lib/wix/orders.test.ts`

**Interfaces:**
- Produces: `translatePaymentStatus(status: string): string`, `translateFulfillmentStatus(status: string): string`, `translateOrderStatus(status: string): string | null`, tipos `WixOrderListItem`, `WixOrderLineItem`, `WixOrderAddress`, `WixOrderDetail`.

- [ ] **Step 1: Escrever os testes das funções de tradução**

```ts
// lib/wix/orders.test.ts
//
// Importa desde já todos os membros do vitest que as Tasks 2 e 3 vão
// precisar (`afterEach`, `beforeEach`, `vi`) — evita ter que voltar aqui
// pra consolidar um import duplicado quando os próximos describes forem
// adicionados. Mesmo padrão de `lib/wix/ecom.test.ts`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  translateFulfillmentStatus,
  translateOrderStatus,
  translatePaymentStatus,
} from "./orders";

describe("lib/wix/orders — tradução de status", () => {
  describe("translatePaymentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translatePaymentStatus("PAID")).toBe("Pago");
      expect(translatePaymentStatus("NOT_PAID")).toBe("Não pago");
      expect(translatePaymentStatus("PENDING")).toBe("Pagamento pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translatePaymentStatus("UNSPECIFIED")).toBe("UNSPECIFIED");
    });
  });

  describe("translateFulfillmentStatus", () => {
    it("traduz um valor mapeado", () => {
      expect(translateFulfillmentStatus("FULFILLED")).toBe("Entregue");
      expect(translateFulfillmentStatus("NOT_FULFILLED")).toBe("Pendente");
    });

    it("cai no valor cru quando não mapeado", () => {
      expect(translateFulfillmentStatus("SOMETHING_NEW")).toBe("SOMETHING_NEW");
    });
  });

  describe("translateOrderStatus", () => {
    it("retorna o label para CANCELED e REJECTED", () => {
      expect(translateOrderStatus("CANCELED")).toBe("Cancelado");
      expect(translateOrderStatus("REJECTED")).toBe("Rejeitado");
    });

    it("retorna null para status normais (não gera badge extra)", () => {
      expect(translateOrderStatus("APPROVED")).toBeNull();
      expect(translateOrderStatus("PENDING")).toBeNull();
      expect(translateOrderStatus("INITIALIZED")).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test -- orders`
Expected: FAIL — `lib/wix/orders.ts` não existe (`Cannot find module './orders'`).

- [ ] **Step 3: Criar `lib/wix/orders.ts` com os tipos e as funções de tradução**

```ts
// lib/wix/orders.ts
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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test -- orders`
Expected: PASS (8 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/wix/orders.ts lib/wix/orders.test.ts
git commit -m "feat(admin): add order status translation helpers"
```

---

### Task 2: `searchOrders()`

**Files:**
- Modify: `lib/wix/orders.ts`
- Test: `lib/wix/orders.test.ts`

**Interfaces:**
- Consumes: `WIX_API_BASE` de `lib/wix/client.ts`, `WIX_METASITE_ID` de `lib/wix/config.ts`, `translatePaymentStatus`/`translateFulfillmentStatus`/`translateOrderStatus` (Task 1).
- Produces: `searchOrders(): Promise<WixOrderListItem[]>`.

- [ ] **Step 1: Escrever os testes de `searchOrders`**

```ts
// lib/wix/orders.test.ts — no topo do arquivo:
// 1. `vitest` já importa afterEach/beforeEach/vi desde a Task 1 — nada a mudar aqui.
// 2. Trocar `import { translateFulfillmentStatus, translateOrderStatus, translatePaymentStatus } from "./orders";`
//    (criado na Task 1) por uma única linha consolidada:
import {
  searchOrders,
  translateFulfillmentStatus,
  translateOrderStatus,
  translatePaymentStatus,
} from "./orders";
// 3. Adicionar estes dois imports novos:
import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// novo describe, no mesmo arquivo, fora do describe de tradução de status
describe("searchOrders", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_ADMIN_API_KEY", "test-admin-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("chama /ecom/v1/orders/search com cursorPaging aninhado sob search e mapeia o payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(`${WIX_API_BASE}/ecom/v1/orders/search`);
      expect(init?.headers).toMatchObject({
        Authorization: "test-admin-key",
        "wix-site-id": WIX_METASITE_ID,
      });
      expect(JSON.parse(init?.body as string)).toEqual({
        search: { cursorPaging: { limit: 100 } },
      });
      return jsonResponse({
        orders: [
          {
            id: "order-1",
            number: 1001,
            createdDate: "2026-08-20T12:00:00.000Z",
            buyerInfo: { email: "cliente@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 169,99" },
              subtotal: { formattedAmount: "R$ 169,99" },
              shipping: { formattedAmount: "R$ 0,00" },
              tax: { formattedAmount: "R$ 0,00" },
            },
            lineItems: [],
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const orders = await searchOrders();

    expect(orders).toEqual([
      {
        id: "order-1",
        number: 1001,
        createdDate: "2026-08-20T12:00:00.000Z",
        buyerEmail: "cliente@example.com",
        totalFormatted: "R$ 169,99",
        paymentStatusLabel: "Pago",
        fulfillmentStatusLabel: "Pendente",
        orderStatusLabel: null,
      },
    ]);
  });

  it("retorna lista vazia quando a Wix não devolve pedidos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ orders: [] })));

    expect(await searchOrders()).toEqual([]);
  });

  it("marca orderStatusLabel quando o pedido está cancelado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          orders: [
            {
              id: "order-2",
              number: 1002,
              createdDate: "2026-08-21T09:00:00.000Z",
              buyerInfo: { email: "outro@example.com" },
              paymentStatus: "NOT_PAID",
              fulfillmentStatus: "NOT_FULFILLED",
              status: "CANCELED",
              priceSummary: {
                total: { formattedAmount: "R$ 50,00" },
                subtotal: { formattedAmount: "R$ 50,00" },
                shipping: { formattedAmount: "R$ 0,00" },
                tax: { formattedAmount: "R$ 0,00" },
              },
              lineItems: [],
            },
          ],
        }),
      ),
    );

    const [order] = await searchOrders();
    expect(order.orderStatusLabel).toBe("Cancelado");
  });

  it("lança quando a Wix responde com erro", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "boom" }, 500)));

    await expect(searchOrders()).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test -- orders`
Expected: FAIL — `searchOrders` não é exportado por `./orders`.

- [ ] **Step 3: Implementar `searchOrders()` em `lib/wix/orders.ts`**

Adicionar os dois imports abaixo no topo do arquivo (junto com `import "server-only";`), e todo o resto abaixo das funções `translate*` já existentes:

```ts
import { WIX_API_BASE } from "./client";
import { WIX_METASITE_ID } from "./config";

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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test -- orders`
Expected: PASS (12 testes no total).

- [ ] **Step 5: Commit**

```bash
git add lib/wix/orders.ts lib/wix/orders.test.ts
git commit -m "feat(admin): add searchOrders against Wix eCommerce API"
```

---

### Task 3: `getOrder()`

**Files:**
- Modify: `lib/wix/orders.ts`
- Test: `lib/wix/orders.test.ts`

**Interfaces:**
- Consumes: `wixOrdersRequest`, `toOrderListItem`, `WixApiOrder` (privados de Task 2), `translate*` (Task 1).
- Produces: `getOrder(orderId: string): Promise<WixOrderDetail | null>`.

- [ ] **Step 1: Escrever os testes de `getOrder`**

```ts
// lib/wix/orders.test.ts — adicionar `getOrder` ao import consolidado de
// "./orders" criado na Task 2 (fica: searchOrders, getOrder, translate*),
// e adicionar um novo describe abaixo do de `searchOrders`:

describe("getOrder", () => {
  beforeEach(() => {
    vi.stubEnv("WIX_ADMIN_API_KEY", "test-admin-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("busca GET /ecom/v1/orders/{id} e mapeia itens, endereço e resumo de preço", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      expect(url).toBe(`${WIX_API_BASE}/ecom/v1/orders/order-1`);
      expect(init?.method).toBe("GET");
      return jsonResponse({
        order: {
          id: "order-1",
          number: 1001,
          createdDate: "2026-08-20T12:00:00.000Z",
          buyerInfo: { email: "cliente@example.com" },
          paymentStatus: "PAID",
          fulfillmentStatus: "FULFILLED",
          status: "APPROVED",
          priceSummary: {
            total: { formattedAmount: "R$ 189,99" },
            subtotal: { formattedAmount: "R$ 169,99" },
            shipping: { formattedAmount: "R$ 20,00" },
            tax: { formattedAmount: "R$ 0,00" },
          },
          lineItems: [
            {
              id: "item-1",
              productName: { original: "A Bruxa do Vale Sombrio" },
              quantity: 2,
              price: { formattedAmount: "R$ 84,99" },
            },
          ],
          recipientInfo: {
            address: {
              streetAddress: { name: "Rua das Flores", number: "123" },
              addressLine2: "Apto 45",
              city: "São Paulo",
              subdivision: "BR-SP",
              postalCode: "01310-000",
              country: "BR",
            },
            contactDetails: { firstName: "Maria", lastName: "Silva", phone: "11999999999" },
          },
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const order = await getOrder("order-1");

    expect(order).toEqual({
      id: "order-1",
      number: 1001,
      createdDate: "2026-08-20T12:00:00.000Z",
      buyerEmail: "cliente@example.com",
      totalFormatted: "R$ 189,99",
      paymentStatusLabel: "Pago",
      fulfillmentStatusLabel: "Entregue",
      orderStatusLabel: null,
      lineItems: [
        { id: "item-1", name: "A Bruxa do Vale Sombrio", quantity: 2, priceFormatted: "R$ 84,99" },
      ],
      shippingAddress: {
        recipientName: "Maria Silva",
        phone: "11999999999",
        street: "Rua das Flores",
        number: "123",
        addressLine2: "Apto 45",
        city: "São Paulo",
        subdivision: "BR-SP",
        postalCode: "01310-000",
        country: "BR",
      },
      priceSummary: {
        subtotalFormatted: "R$ 169,99",
        shippingFormatted: "R$ 20,00",
        taxFormatted: "R$ 0,00",
        totalFormatted: "R$ 189,99",
      },
    });
  });

  it("retorna null quando a Wix responde 404 (ORDER_NOT_FOUND)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "not found" }, 404)));

    expect(await getOrder("inexistente")).toBeNull();
  });

  it("retorna shippingAddress null quando o pedido não tem recipientInfo.address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          order: {
            id: "order-3",
            number: 1003,
            createdDate: "2026-08-22T09:00:00.000Z",
            buyerInfo: { email: "sem-endereco@example.com" },
            paymentStatus: "PAID",
            fulfillmentStatus: "NOT_FULFILLED",
            status: "APPROVED",
            priceSummary: {
              total: { formattedAmount: "R$ 30,00" },
              subtotal: { formattedAmount: "R$ 30,00" },
              shipping: { formattedAmount: "R$ 0,00" },
              tax: { formattedAmount: "R$ 0,00" },
            },
            lineItems: [],
          },
        }),
      ),
    );

    const order = await getOrder("order-3");
    expect(order?.shippingAddress).toBeNull();
  });

  it("propaga outros erros", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "boom" }, 500)));

    await expect(getOrder("order-1")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test -- orders`
Expected: FAIL — `getOrder` não é exportado por `./orders`.

- [ ] **Step 3: Implementar `getOrder()` em `lib/wix/orders.ts`**

Adicionar ao final do arquivo:

```ts
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
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test -- orders`
Expected: PASS (16 testes no total).

- [ ] **Step 5: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add lib/wix/orders.ts lib/wix/orders.test.ts
git commit -m "feat(admin): add getOrder against Wix eCommerce API"
```

---

### Task 4: Route Handler `POST /api/admin/orders`

**Files:**
- Create: `app/api/admin/orders/route.ts`

**Interfaces:**
- Consumes: `resolveMemberFromRequest` de `lib/wix/resolve-member.ts`, `isAdminEmail` de `lib/wix/admin.ts`, `searchOrders` de `lib/wix/orders.ts` (Task 2).
- Produces: `POST /api/admin/orders` → `200 { orders: WixOrderListItem[] }` | `401 { error: "unauthorized" }` | `403 { error: "forbidden" }`.

- [ ] **Step 1: Criar a rota**

```ts
// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { searchOrders } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const orders = await searchOrders();
  return NextResponse.json({ orders });
}
```

- [ ] **Step 2: Verificar manualmente sem servidor rodando ainda não é possível — validar só com type-check**

Run: `npm run type-check`
Expected: sem erros (a rota só usa tipos e módulos já existentes, não depende de tipos gerados por rota dinâmica).

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/orders/route.ts
git commit -m "feat(admin): add POST /api/admin/orders route"
```

---

### Task 5: Route Handler `POST /api/admin/orders/[id]`

**Files:**
- Create: `app/api/admin/orders/[id]/route.ts`

**Interfaces:**
- Consumes: `resolveMemberFromRequest`, `isAdminEmail`, `getOrder` de `lib/wix/orders.ts` (Task 3).
- Produces: `POST /api/admin/orders/[id]` → `200 { order: WixOrderDetail }` | `401 { error: "unauthorized" }` | `403 { error: "forbidden" }` | `404 { error: "not_found" }`.

- [ ] **Step 1: Criar a rota**

```ts
// app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/wix/admin";
import { getOrder } from "@/lib/wix/orders";
import { resolveMemberFromRequest } from "@/lib/wix/resolve-member";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const member = await resolveMemberFromRequest(request);
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const isAdmin = await isAdminEmail(member.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
```

- [ ] **Step 2: Gerar os tipos de rota e rodar type-check**

O tipo `RouteContext<"/api/admin/orders/[id]">` é gerado em `.next/dev/types/` a partir da própria pasta de rota — precisa existir a pasta `[id]` primeiro (já criada no Step 1 acima).

Run: `npm run dev` (deixar subir, esperar "Ready", depois `Ctrl+C`)
Run: `npm run type-check`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/api/admin/orders/[id]/route.ts"
git commit -m "feat(admin): add POST /api/admin/orders/[id] route"
```

---

### Task 6: Lista de pedidos (`/admin/pedidos`)

**Files:**
- Create: `app/(admin)/admin/pedidos/_lib/format-order-date.ts`
- Create: `app/(admin)/admin/pedidos/_components/orders-list-content.tsx`
- Modify: `app/(admin)/admin/pedidos/page.tsx`

**Interfaces:**
- Consumes: `getAccessToken` de `lib/wix/client.ts`, `WixOrderListItem` (tipo, Task 1), `Badge` de `components/ui/badge.tsx`.
- Produces: `formatOrderDate(isoDate: string): string`, componente `<OrdersListContent />`.

- [ ] **Step 1: Criar o helper de data client-safe**

```ts
// app/(admin)/admin/pedidos/_lib/format-order-date.ts
/** `lib/format.ts` é `server-only` — este helper existe porque as páginas
 * de pedidos são Client Components (ver spec, seção "O problema central"). */
export function formatOrderDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
```

- [ ] **Step 2: Criar o Client Component da lista**

```tsx
// app/(admin)/admin/pedidos/_components/orders-list-content.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/wix/client";
import type { WixOrderListItem } from "@/lib/wix/orders";

import { formatOrderDate } from "../_lib/format-order-date";

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; orders: WixOrderListItem[] };

export function OrdersListContent() {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/orders", {
          method: "POST",
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState({ status: "loaded", orders: data.orders });
      } catch {
        if (cancelled) return;
        setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Carregando pedidos…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-muted-foreground">Não foi possível carregar os pedidos.</p>
    );
  }

  if (state.orders.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {state.orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/pedidos/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-mono text-sm text-foreground tabular-nums">#{order.number}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.buyerEmail} · {formatOrderDate(order.createdDate)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-foreground tabular-nums">
                {order.totalFormatted}
              </span>
              <Badge variant="outline">{order.paymentStatusLabel}</Badge>
              <Badge variant="secondary">{order.fulfillmentStatusLabel}</Badge>
              {order.orderStatusLabel ? (
                <Badge variant="destructive">{order.orderStatusLabel}</Badge>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Substituir o shell da página**

```tsx
// app/(admin)/admin/pedidos/page.tsx
import type { Metadata } from "next";

import { OrdersListContent } from "./_components/orders-list-content";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  return <OrdersListContent />;
}
```

- [ ] **Step 4: Rodar type-check e lint**

Run: `npm run type-check && npm run lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/pedidos/page.tsx" "app/(admin)/admin/pedidos/_components/orders-list-content.tsx" "app/(admin)/admin/pedidos/_lib/format-order-date.ts"
git commit -m "feat(admin): render orders list from Wix"
```

---

### Task 7: Detalhe de pedido (`/admin/pedidos/[id]`)

**Files:**
- Rename: `app/(admin)/admin/pedidos/[numero]/` → `app/(admin)/admin/pedidos/[id]/`
- Create: `app/(admin)/admin/pedidos/[id]/_components/order-detail-content.tsx`
- Modify: `app/(admin)/admin/pedidos/[id]/page.tsx`

**Interfaces:**
- Consumes: `getAccessToken` (Task 6 já importou de `lib/wix/client.ts`), `WixOrderDetail` (tipo, Task 3), `formatOrderDate` (Task 6), `Badge`.

- [ ] **Step 1: Renomear a pasta de rota preservando histórico**

```bash
git mv "app/(admin)/admin/pedidos/[numero]" "app/(admin)/admin/pedidos/[id]"
```

- [ ] **Step 2: Criar o Client Component do detalhe**

```tsx
// app/(admin)/admin/pedidos/[id]/_components/order-detail-content.tsx
"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/wix/client";
import type { WixOrderDetail } from "@/lib/wix/orders";

import { formatOrderDate } from "../../_lib/format-order-date";

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "loaded"; order: WixOrderDetail };

export function OrderDetailContent({ orderId }: { orderId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: "POST",
          headers: { Authorization: token },
        });
        if (res.status === 404) {
          if (!cancelled) setState({ status: "not-found" });
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setState({ status: "loaded", order: data.order });
      } catch {
        if (cancelled) return;
        setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Carregando pedido…</p>;
  }

  if (state.status === "not-found") {
    return <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-muted-foreground">Não foi possível carregar o pedido.</p>;
  }

  const { order } = state;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">#{order.number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formatOrderDate(order.createdDate)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{order.paymentStatusLabel}</Badge>
          <Badge variant="secondary">{order.fulfillmentStatusLabel}</Badge>
          {order.orderStatusLabel ? (
            <Badge variant="destructive">{order.orderStatusLabel}</Badge>
          ) : null}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Cliente
        </h2>
        <p className="mt-2 text-sm text-foreground">{order.buyerEmail}</p>
      </section>

      {order.shippingAddress ? (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Endereço de entrega
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {order.shippingAddress.recipientName} — {order.shippingAddress.street},{" "}
            {order.shippingAddress.number}
            {order.shippingAddress.addressLine2 ? ` (${order.shippingAddress.addressLine2})` : ""}
            <br />
            {order.shippingAddress.city} - {order.shippingAddress.subdivision}
            <br />
            CEP {order.shippingAddress.postalCode}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Itens
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {order.lineItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
              </div>
              <span className="font-mono text-sm text-foreground tabular-nums">
                {item.priceFormatted}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1 border-t border-border pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">{order.priceSummary.subtotalFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Frete</span>
          <span className="font-mono tabular-nums">{order.priceSummary.shippingFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Impostos</span>
          <span className="font-mono tabular-nums">{order.priceSummary.taxFormatted}</span>
        </div>
        <div className="flex items-center justify-between text-base font-medium text-foreground">
          <span>Total</span>
          <span className="font-mono tabular-nums">{order.priceSummary.totalFormatted}</span>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Substituir o shell da página**

```tsx
// app/(admin)/admin/pedidos/[id]/page.tsx
import type { Metadata } from "next";

import { OrderDetailContent } from "./_components/order-detail-content";

export const metadata: Metadata = { title: "Detalhe do pedido" };

export default async function AdminOrderDetailPage(props: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await props.params;
  return <OrderDetailContent orderId={id} />;
}
```

- [ ] **Step 4: Gerar os tipos de rota e rodar type-check**

Run: `npm run dev` (deixar subir, esperar "Ready", depois `Ctrl+C`)
Run: `npm run type-check && npm run lint`
Expected: sem erros. Confirmar também que não sobrou nenhuma referência a `[numero]` no repo:

Run: `grep -rn "\[numero\]" app/ lib/ components/ --include="*.tsx" --include="*.ts"`
Expected: nenhum resultado.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/pedidos/[id]"
git commit -m "feat(admin): render order detail from Wix, rename route param to [id]"
```

(depois do `git mv` no Step 1, `[numero]` não existe mais no working tree — `git add` na pasta `[id]` já cobre a renomeação e os arquivos novos/modificados dentro dela.)

---

### Task 8: Verificação final

**Files:** nenhum arquivo novo — só validação.

- [ ] **Step 1: Suite de testes do módulo**

Run: `npm run test -- orders`
Expected: PASS (todos os testes de `lib/wix/orders.test.ts`).

- [ ] **Step 2: Type-check e lint completos**

Run: `npm run type-check && npm run lint`
Expected: sem erros.

- [ ] **Step 3: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros (confirma que as duas Route Handlers e as duas páginas compilam em modo produção, não só em dev).

- [ ] **Step 4: Teste manual — 401 sem token**

Run: `curl -i -X POST http://localhost:3000/api/admin/orders`
(com `npm run dev` rodando)
Expected: `HTTP/1.1 401` e corpo `{"error":"unauthorized"}`.

- [ ] **Step 5: Teste manual — UI como admin**

Acessar `/admin/pedidos` logado como admin no navegador. Expected: "Verificando acesso…" some, depois "Nenhum pedido ainda." aparece (loja sem pedidos reais ainda), sem erro no console do navegador.

- [ ] **Step 6: Commit final (se sobrar algo não commitado)**

Run: `git status`
Se houver mudanças pendentes (não deveria, cada task já commitou), revisar e commitar.

---

## Self-Review

**Cobertura da spec:** todas as seções da spec revisada têm task correspondente — `lib/wix/orders.ts` + testes (Tasks 1–3), as duas Route Handlers (Tasks 4–5), lista e detalhe como Client Components dentro do `AdminGate` já existente (Tasks 6–7, o `AdminGate` em si não muda), renomeação de pasta `[numero]`→`[id]` (Task 7), terceiro badge condicional de `order.status` (Tasks 1, 6, 7), verificação via `type-check && lint && test` + curl 401 + UI vazia (Task 8).

**Placeholders:** nenhum "TBD"/"similar to Task N" — todo código de cada step está completo e é o código real a escrever.

**Consistência de tipos:** `WixOrderListItem`/`WixOrderLineItem`/`WixOrderAddress`/`WixOrderDetail` (Task 1) são os mesmos tipos usados em `searchOrders`/`getOrder` (Tasks 2–3), nas Route Handlers (Tasks 4–5) e nos Client Components (Tasks 6–7) — sem renomeação de campo entre tasks.
