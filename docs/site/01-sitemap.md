# Sitemap

Mapa real das rotas implementadas. As perguntas que estavam em aberto na
versão anterior deste arquivo foram todas respondidas na implementação.

## Rotas

| Rota | Renderização | Descrição |
|---|---|---|
| `/` | Estática | Hero escura + prateleira dos universos |
| `/catalogo` | Dinâmica | Grade de universos + grade de livros, com filtro `?universo=` |
| `/catalogo/[slug]` | SSG (uma por livro) | Página de livro — **template** a ser otimizado |
| `/campanhas` | Estática | Pré-vendas, assinaturas e eventos |
| `/sobre` | Estática | Manifesto, princípios editoriais, universos |
| `/contato` | Estática | Canais diretos + formulário com Server Action |
| `/perfil` | Estática | Maquete de conta — estante e pedidos fictícios |

`/catalogo` é a única rota dinâmica: ela lê `searchParams` para o filtro por
universo. É uma troca consciente — mantém o estado na URL (compartilhável,
navegável pelo histórico) sem exigir JavaScript de cliente.

## Navegação

- **Menu principal** (header e rodapé): Home · Catálogo · Campanhas · Sobre ·
  Contato.
- **Perfil** fica fora do menu — é acessado pelo ícone de conta no header, e
  também aparece no menu mobile como "Minha conta".
- Não há carrinho. A venda é por link externo, por livro (`buyUrl` no
  schema), então o ícone de carrinho foi removido do header.

## Camada de dados

Sem CMS. Dados estáticos tipados com Zod em `lib/data/`:

- `schemas.ts` — contrato de `universe`, `book` e `campaign`
- `universes.ts`, `books.ts`, `campaigns.ts` — dados validados no topo do
  módulo (`.parse()` roda uma vez por processo; no build, para rotas
  estáticas)

A integridade referencial é verificada no boot: um livro apontando para
universo inexistente, ou campanha apontando para livro inexistente, derruba
o build em vez de virar link morto em produção.

Cada rota acessa esses dados pela sua própria camada `_data-access/`, mesmo
sendo dado estático — é o ponto de troca para CMS ou banco no futuro, sem
alterar nenhum componente.

## Conteúdo

Os textos e a lista de livros são **placeholder plausível**, não o catálogo
real da editora. O site Wix de origem está inacabado e foi usado apenas como
referência de estrutura (ver `00-overview.md`).
