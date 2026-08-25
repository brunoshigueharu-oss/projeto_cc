# Admin de pedidos via Wix (fase 3 da migração) — design

## Contexto

A migração Supabase → Wix foi combinada em 3 fases (ver
`2026-08-23-wix-members-auth-migration-design.md`): (1) Auth — feita;
(2) Loja/Checkout via Wix Stores — feita
(`docs/superpowers/plans/pode-ir-pelo-ponto-parallel-dove.md`, já mesclada
na `main`); (3) Admin (dashboard, pedidos) consumindo dados do Wix — esta
spec.

Hoje as três telas do admin (`/admin`, `/admin/pedidos`,
`/admin/pedidos/[numero]`) mostram apenas `<MaintenanceNotice>` — nenhuma
busca real de dado acontece desde que o backend Postgres foi removido na
fase 1. Com o checkout já criando pedidos reais no Wix Stores, esta fase
religa `/admin/pedidos` e `/admin/pedidos/[id]` a dados de verdade.

**Fora de escopo desta fase (decisão do usuário):** o dashboard de
métricas (`/admin`) fica em manutenção — a Wix não tem um endpoint de
métricas agregadas, e ainda não existe nenhum pedido real no sistema pra
justificar esse cálculo agora. Fica para quando houver volume de pedidos
real.

## O problema central: onde os dados podem ser buscados

O gate de `/admin` (`components/admin-gate.tsx`, decisão já tomada na
fase 1) roda **inteiramente no client**: pega o token do membro
(`getAccessToken()`), chama `POST /api/admin/check` e só renderiza
`children` se a resposta confirmar admin. O token do membro Wix vive só em
`localStorage` — não há cookie de sessão que um Server Component possa
ler.

Se `pedidos/page.tsx` virasse um Server Component buscando pedidos direto
na Wix, esse dado (nome, e-mail, endereço de clientes) estaria embutido no
HTML/RSC enviado pelo servidor **antes** do `AdminGate` sequer rodar no
client — qualquer visitante não autenticado que acessasse a URL veria os
dados reais por um instante, mesmo que a UI "pareça" travada depois. É o
mesmo problema que a fase 1 já tinha identificado e resolvido para o
gate em si (`2026-08-23-wix-members-auth-migration-design.md`, seção
"Sessão: client-side em toda parte"); agora ele se aplica ao *conteúdo*.

**Alternativa descartada:** buscar os pedidos direto no Server Component
com a Admin API Key, sem checagem por request. Rejeitada pelo mesmo motivo
que a fase 1 rejeitou o bypass via service role key para `/perfil` e
`/admin`: sem uma sessão que o servidor possa validar por requisição, um
Server Component não tem como saber se quem está pedindo a página é
realmente o admin.

## Decisão: estender o padrão do `/api/admin/check`

`/api/admin/check` já resolve exatamente esse problema para a checagem de
acesso — ele lê o token do header `Authorization`, resolve a identidade
via `resolveMemberFromRequest()` e confirma admin via `isAdminEmail()`.
Esta fase estende o mesmo padrão para servir dado, não só um booleano:

- **`lib/wix/orders.ts`** (novo, server-only): `searchOrders()` e
  `getOrder(orderId)`, autenticados com `WIX_ADMIN_API_KEY` +
  header `wix-site-id` — mesmo padrão de `lib/wix/admin.ts`. Inclui
  também as funções puras de tradução de status (ver abaixo), exportadas
  para teste.
- **`app/api/admin/orders/route.ts`** (novo): `POST`, mesma checagem dupla
  do `/api/admin/check` (`resolveMemberFromRequest` + `isAdminEmail`);
  se admin, chama `searchOrders()` e devolve a lista já traduzida.
- **`app/api/admin/orders/[id]/route.ts`** (novo): mesma checagem, chama
  `getOrder(id)`; 404 se a Wix devolver `ORDER_NOT_FOUND`.
- **Páginas viram Client Components** dentro do `<AdminGate>` já
  existente (mesma exceção documentada na fase 1 para rotas sem sessão
  server-legível — não é um novo precedente, é extensão do mesmo): pegam
  o token do membro e buscam desses dois endpoints, só depois de o
  `AdminGate` já ter confirmado admin.

Nenhum dado de pedido é renderizado no servidor sem a checagem de admin
já ter passado.

## Estrutura de arquivos

```
lib/wix/orders.ts                                   (novo — fetch + tradução de status)
lib/wix/orders.test.ts                              (novo)
app/api/admin/orders/route.ts                       (novo)
app/api/admin/orders/[id]/route.ts                  (novo)
app/(admin)/admin/pedidos/page.tsx                  (modificado — shell fino)
app/(admin)/admin/pedidos/_components/
  orders-list-content.tsx                           (novo — Client Component)
app/(admin)/admin/pedidos/[numero]/  →  [id]/       (pasta renomeada)
app/(admin)/admin/pedidos/[id]/page.tsx             (modificado — shell fino)
app/(admin)/admin/pedidos/[id]/_components/
  order-detail-content.tsx                          (novo — Client Component)
```

A pasta de rota muda de `[numero]` para `[id]`: a Wix não tem um "get
order by number" direto (só por ID via `GET /ecom/v1/orders/{orderId}`),
então o identificador da URL passa a ser o ID do pedido — o número
humano (`order.number`) continua exibido na tela normalmente, só deixa
de ser o identificador técnico.

## Dados e tradução de status

A Wix expõe `paymentStatus` e `fulfillmentStatus` como dois campos
independentes — não faz sentido forçá-los num único status como o
sistema antigo (`entregue`/`em-transito`/`processando`/`cancelado`)
tinha; a tela mostra dois badges traduzidos:

```ts
// lib/wix/orders.ts
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
```

Valores fora do mapa (ex. `UNSPECIFIED`) caem no próprio valor cru da
Wix (nunca quebra a tela por causa de um status novo que a Wix venha a
introduzir).

**Terceiro badge condicional — `order.status`.** `paymentStatus` e
`fulfillmentStatus` não indicam cancelamento: o enum real de
`fulfillmentStatus` é só `NOT_FULFILLED` / `FULFILLED` /
`PARTIALLY_FULFILLED` (confirmado na documentação oficial — não existe
`CANCELLED` aí, era um erro da primeira versão desta spec). Quem
carrega esse sinal é o campo separado `order.status`, que inclui
`CANCELED` e `REJECTED`. Sem lê-lo, um pedido cancelado ficaria com
badges normais, indistinguível de um pedido em andamento. Por isso a
tela mostra um terceiro badge (`variant="destructive"`) só quando
`order.status` for `CANCELED` ou `REJECTED` — não aparece em pedidos
normais (`APPROVED`/`PENDING`/`INITIALIZED`):

```ts
// lib/wix/orders.ts
const ORDER_STATUS_LABELS: Record<string, string> = {
  CANCELED: "Cancelado",
  REJECTED: "Rejeitado",
};
```

Nota técnica pro plano de implementação: `searchOrders()` sem filtro
já não traz pedidos com `status: PENDING`/`REJECTED`/`INITIALIZED` —
é o comportamento *default* da própria API (confirmado na
documentação), não algo que este código precisa filtrar. Só
`REJECTED` pode aparecer via `getOrder(id)` direto (acesso a um link
específico), daí o badge condicional valer também pro detalhe.

Preço: a Wix já devolve `priceSummary.total.formattedAmount` (string
pronta, ex. `"R$ 169,99"`) — usar direto, sem reimplementar formatação
(o projeto tem `lib/format.ts`, mas ele trabalha em centavos; o pedido da
Wix já vem formatado e não precisa dessa camada).

Outros campos confirmados na documentação oficial (evita nomes
chutados na hora de escrever o plano): nome do item é
`lineItem.productName.original` (não `.name`); endereço de entrega é
`order.recipientInfo.address` + `.contactDetails` (tipo
`AddressWithContact`) — é o campo que a própria Wix recomenda para "quem
efetivamente recebe o pedido", mais confiável que vasculhar
`shippingInfo.logistics` (que fica vazio em pickup point/store pickup);
e-mail do comprador é `order.buyerInfo.email`.

`searchOrders()` usa `POST /ecom/v1/orders/search` sem filtro (traz tudo,
ordenado por `createdDate DESC` por padrão da própria API,
`cursorPaging.limit: 100`) — paginação de verdade fica pra quando o
volume de pedidos justificar; hoje a loja tem zero pedidos.

## UI

**Lista (`orders-list-content.tsx`)**: mesma estrutura visual da versão
antiga (`Link` por pedido, número + comprador + data à esquerda, total +
badges à direita) — troca só a fonte do dado e os badges. Estados:
carregando, erro (mensagem genérica), vazio ("Nenhum pedido ainda."),
lista. Badges: pagamento + fulfillment sempre; o badge de `order.status`
(`variant="destructive"`) só aparece quando `CANCELED`/`REJECTED`.

**Detalhe (`order-detail-content.tsx`)**: número do pedido, data,
e-mail do comprador, itens (nome, quantidade, preço), endereço de
entrega, resumo de preço (subtotal/frete/impostos/total), os mesmos
badges de status da lista (payment + fulfillment sempre, `order.status`
condicional). 404 → "Pedido não encontrado."

## Testes

`lib/wix/orders.test.ts` segue o padrão de `lib/wix/ecom.test.ts` (mock
de `fetch` global, não do módulo): cobre o payload de `searchOrders`,
erro 404 tratado em `getOrder`, e as funções de tradução de status
(mapeado e fallback pro valor cru).

Como não existe nenhum pedido real ainda, a verificação manual fica
limitada a: estado vazio da lista renderiza corretamente, e acesso sem
token/sem ser admin aos dois endpoints novos devolve 401/403 (mesmo
comportamento do `/api/admin/check` hoje). Renderização de um pedido
real só pode ser confirmada quando o primeiro pedido pago existir.

## Fora de escopo

- Dashboard de métricas (`/admin`) — permanece em manutenção.
- Ações do admin sobre o pedido (marcar como enviado, cancelar,
  reembolsar) — só leitura nesta fase.
- Paginação real da lista de pedidos — YAGNI enquanto o volume for baixo.
- Nota fiscal, e-mail de atualização de status — já fora de escopo desde
  a fase 2.

## Verificação

`npm run type-check && npm run lint && npm run test -- orders`. Teste
manual: acessar `/admin/pedidos` como admin (vazio, sem erro no console);
acessar `/api/admin/orders` sem header `Authorization` via `curl` e
confirmar 401.
