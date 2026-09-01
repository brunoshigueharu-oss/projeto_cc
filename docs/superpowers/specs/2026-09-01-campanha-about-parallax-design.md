# Parallax do Yanayag como divisor no "Sobre o projeto" da campanha — design

## Contexto

A página `/campanhas` (`CampaignAbout`) mostra o texto "Sobre o projeto" da
campanha do Yanayag como um bloco único: título + todos os parágrafos de
`campaign.about` ao lado da ficha técnica, sem nenhuma quebra visual. O texto
é longo (5 parágrafos) e fica cansativo de ler de uma vez.

A página `/catalogo/[slug]` já tem uma faixa de parallax
(`ParallaxSection`, em `catalogo/[slug]/_components/`) usada como divisor
decorativo entre o hero e "O Livro", alimentada por `book.parallax` — já
preenchido para o Yanayag em `lib/data/books.ts`. Essa rota do catálogo ainda
não está em uso (só vai voltar quando a fase de campanha terminar), mas o
componente e os dados já existem e podem ser reaproveitados agora.

Pedido do usuário: trazer essa faixa de parallax para dentro do "Sobre o
projeto" da campanha, como um bloco isolado (largura cheia, fora do
container de texto), logo depois do primeiro parágrafo — funcionando como
divisor do texto longo.

## Decisão

1. **Compartilhar o componente.** `parallax-section.tsx` passa a ser usado em
   duas rotas (catálogo e campanha), então move de
   `app/(site)/catalogo/[slug]/_components/parallax-section.tsx` para
   `components/parallax-section.tsx` (regra do projeto: componente usado em
   mais de uma página vai para o diretório global). Atualiza os dois
   imports (`catalogo/[slug]/page.tsx` e `campanhas/_components/campaign-about.tsx`).
   Nenhuma mudança no componente em si.

2. **Dividir `CampaignAbout` em dois blocos**, com a `ParallaxSection` full-width
   entre eles (sem container `max-w-6xl` em volta, igual já acontece no
   catálogo):
   - Bloco 1 (`max-w-6xl`, padding só em cima): kicker "Sobre o projeto" +
     título + **primeiro parágrafo** de `paragraphs`.
   - `<ParallaxSection layers={primaryBook?.parallax ?? []} />` encostada
     logo depois, sem padding/gap extra — mesma lógica de transição já usada
     no catálogo (`BookHero` → `ParallaxSection` → `AboutBookSection`, sem
     espaço entre as sections, o divisor é a própria faixa).
   - Bloco 2 (`max-w-6xl`, padding só embaixo): parágrafos restantes ao lado
     da ficha técnica (layout atual, inalterado) + galeria de páginas
     internas (inalterada).

3. **Reaproveita dado existente.** Nenhum campo novo em `schemas.ts` ou
   `books.ts` — `primaryBook.parallax` já existe para o Yanayag. Como
   `ParallaxSection` retorna `null` quando `layers` está vazio, o divisor
   simplesmente não aparece em campanhas de livros sem parallax (nenhuma
   verificação extra necessária em `CampaignAbout`).

4. **Largura do primeiro parágrafo isolado.** Sem a ficha técnica ao lado
   para limitar a largura da coluna de texto, o primeiro parágrafo sozinho
   ganha `max-w-3xl` — mesma largura máxima já usada no `<h1>` do título,
   mantendo a mesma medida de linha em vez de esticar por todo o
   `max-w-6xl`.

## Fora de escopo

- Não migra o restante do conteúdo do catálogo (galeria de páginas, box
  contents, etc.) para a campanha — só a `ParallaxSection`, conforme pedido.
- Não altera o componente `ParallaxSection` em si, nem os dados de
  `book.parallax` do Yanayag.
- Não mexe na ordem das seções da página (`CampaignBanner` →
  `CampaignProgress` → `CampaignAbout` → ...) — só o conteúdo interno de
  `CampaignAbout`.
