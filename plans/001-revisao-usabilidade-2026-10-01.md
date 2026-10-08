# Revisão de usabilidade — Hocus Pocus

Data: 01/10/2026. Base: commit `bf9a131`. Status: relatório preservado. Todas as alterações de implementação desta revisão foram revertidas a pedido do usuário; nenhuma recomendação está autorizada para reaplicação automática.

## Objetivo e alcance

Orientar o Claude na próxima rodada de melhorias, preservando a identidade visual. Revisão do código atual e inspeção do site local em `http://localhost:3123`: Home em desktop e catálogo em viewport 390 × 844. A porta 3000 exibia outro projeto (TCC) e não foi usada como evidência deste site.

Os problemas abaixo foram confirmados pela leitura dos arquivos citados; a interface de Home, catálogo e rodapé também foi observada no navegador. Cenários de autenticação, pagamento, falha de rede e retorno de checkout são deduções do fluxo de código, **não testes ponta a ponta contra Wix**. Não foram realizados pedidos, envios de mensagens ou cadastros. Não houve auditoria completa de produção, segurança, desempenho, contraste ou uso com leitor de tela real.

A revisão considera as correções recentes de `bf9a131`; não pede novamente o menu mobile acessível, lightbox por teclado, feedback de adicionar ao carrinho, remoção com desfazer ou limpeza do filtro inválido.

## Prioridades

P1: perda de dados, falsa confirmação ou bloqueio de jornada. P2: fricção relevante. S: horas; M: aproximadamente um dia; L: vários dias. Estimativas incluem validação e dependem das integrações disponíveis.

| ID | Prioridade | Problema | Esforço | Risco da correção | Confiança |
|---|---|---|---|---|---|
| UX-01 | P1 | Contato confirma mensagem que não envia | S para mitigação; M para integrar | Baixo na mitigação; médio na integração | Alta |
| UX-02 | P1 | Confirmação antiga limpa um carrinho novo | M–L | Alto: integridade da compra | Alta no código |
| UX-03 | P1 | Login não permite concluir verificação de e-mail | M | Médio: autenticação | Alta no código; ocorrência depende do Wix |
| UX-04 | P2 | Newsletter promete inscrição sem processamento | S para remover; M para integrar | Baixo | Alta |
| UX-05 | P2 | Nove links do rodapé não têm destino | S após receber URLs | Baixo | Alta |
| UX-06 | P2 | Banner muda sozinho e vídeos não respeitam movimento reduzido | M | Médio: carrossel e vídeos | Alta |
| UX-07 | P2 | Quantidade não aceita apagar para redigitar | S | Baixo | Alta no código |
| UX-08 | P2 | Recuperação de senha oculta falhas operacionais | S–M | Médio: preservar privacidade da conta | Alta no código |

Ordem recomendada: UX-01 → UX-02 → UX-03 → UX-04/05 → UX-06 → UX-07 → UX-08. Os itens não dependem uns dos outros; UX-04 e UX-05 compartilham o rodapé e devem ser feitos no mesmo lote. Criar testes de regressão antes de alterar UX-02 e UX-03.

## Instruções comuns para o Claude

1. Conferir `git diff bf9a131..HEAD -- app components lib` e revalidar as evidências se houve mudanças. Não reintroduzir soluções que já foram implementadas.
2. Ler AGENTS.md e os guias relevantes em `node_modules/next/dist/docs/` antes de escrever código Next.js. Usar React 19, App Router, Tailwind 4, componentes Base UI existentes e Zod 4; evitar novas dependências sem necessidade concreta.
3. Manter Server Components onde possível, dados tipados em `lib/data`, leitura por `_data-access` e padrões dos formulários existentes. Usar `components/form-status.tsx` para feedback e `Field`/`FieldError` para validação.
4. Trabalhar um item por vez, sem reformular o site inteiro. Preservar mudanças locais do usuário, incluindo arquivos não relacionados.
5. Para cada correção: teste focado do comportamento, `npm run type-check` e `npx eslint app components lib`; executar também `npm run lint` e distinguir seu problema preexistente de escopo de regressões introduzidas. Não usar `--fix` globalmente.
6. Não efetuar compras nem enviar mensagens reais para validar. Usar mocks e ambiente de testes autorizado. Não inventar credenciais, URLs de redes sociais, textos de políticas ou capacidades do Wix.
7. Parar e relatar dependências faltantes se uma solução exigir provedor, conteúdo editorial ou contrato de API não confirmado. Entregar mitigação honesta quando possível, sem simular sucesso.

## UX-01 — Não confirmar contato sem entrega

**Evidência:** `app/(site)/contato/_actions/send-message.ts:30` declara que a mensagem é descartada; linhas 33–36 retornam sucesso e prometem resposta. `app/(site)/contato/page.tsx` expõe o formulário normalmente.

**Cenário:** uma pessoa preenche contato para resolver um pedido, vê “Mensagem recebida” e espera até cinco dias úteis, mas a equipe não recebeu nada. O problema não é apenas falta de integração; é o feedback enganoso.

**Escopo:** action, formulário, página de contato e teste local correspondente. Fora de escopo: redesenhar a página ou escolher um serviço pago automaticamente.

**Implementação:** enquanto não houver provedor configurado, substituir o envio por aviso explícito de indisponibilidade e canais já existentes. Se houver integração aprovada, manter validação no servidor e honeypot; retornar sucesso somente após aceite do provedor, tratar falhas e preservar a mensagem digitada para nova tentativa. Não prometer entrega final só porque o provedor aceitou o envio.

**Aceite:** dados inválidos não chegam ao provedor; falha não exibe sucesso nem limpa o texto; sucesso corresponde a chamada bem-sucedida; estado sem configuração oferece um canal real. Testar com mock do provedor em `send-message.test.ts`, executando `npm run test -- send-message.test.ts`.

## UX-02 — Vincular confirmação à compra antes de limpar carrinho

**Evidência:** `app/(site)/checkout/confirmacao/page.tsx:16` lê `orderId` diretamente da URL; `app/(site)/checkout/confirmacao/_components/confirmation-content.tsx:23` executa `if (orderId) clear()`. `lib/cart/cart-context.tsx:144` apaga todas as linhas, sem vínculo com checkout. A mesma tela afirma “Pedido confirmado!” com base apenas nesse parâmetro.

**Cenário:** após uma compra, a pessoa monta outro carrinho e reabre a URL antiga de confirmação pelo histórico. A montagem da página limpa as novas escolhas. Também há risco de apagar itens acrescentados em outra aba enquanto uma compra estava em andamento.

**Escopo:** confirmação, início do checkout em `checkout-content.tsx`, integração `lib/wix/ecom.ts`, operações de carrinho e testes relacionados. Fora de escopo: trocar plataforma de pagamento.

**Implementação:** começar com teste do reingresso na mesma confirmação. Confirmar o contrato atual do Wix para status e identidade do pedido; não tratar parâmetro de URL como prova de pagamento. Registrar a composição do checkout iniciado e reconciliar somente as quantidades efetivamente compradas, uma única vez por pedido confirmado. Preservar compras posteriores e itens adicionados em outra aba. Exibir estado pendente/erro quando não houver confirmação confiável, sem declarar pagamento aprovado.

**Aceite:** URL sem pedido, inválida ou antiga não apaga novos itens; repetir confirmação é idempotente; pedido confirmado remove apenas sua composição; cancelamento preserva tudo. Criar `confirmation-content.test.tsx` e testes da reconciliação; rodar os arquivos individualmente. Usar `app/(site)/carrinho/page.test.tsx` como exemplo de montagem React e mocks. Se não existir forma confiável de verificar o pedido, interromper a parte de integração e relatar a lacuna, sem criar um simples booleano de “pago” no cliente.

## UX-03 — Permitir retomar a verificação de cadastro no login

**Evidência:** `app/(auth)/login/_components/login-form.tsx:40–49` trata qualquer estado diferente de SUCCESS apenas com uma mensagem; descarta `stateToken`. `lib/wix/members-auth.ts:39–41,102–109` distingue os estados e retorna o token. `app/(auth)/cadastro/_components/cadastro-form.tsx:26–28` mantém fase e token só no estado React; linhas 51–54 e 98–123 contêm a UI de código.

**Cenário:** a pessoa interrompe/recarrega cadastro antes de inserir o código. Ao entrar posteriormente, se o Wix exigir verificação, o site orienta olhar o e-mail mas não oferece onde inserir o código. Aprovação do administrador também recebe orientação inadequada no login.

**Escopo:** formulários de login/cadastro, componente compartilhado de verificação se necessário e testes. Manter as funções de integração existentes como contrato, sem reescrever OAuth.

**Implementação:** diferenciar SUCCESS, REQUIRE_EMAIL_VERIFICATION e REQUIRE_OWNER_APPROVAL. Permitir inserir o código no login usando o token retornado; reaproveitar a UI existente. Token ausente/expirado deve produzir uma saída recuperável, nunca botão silencioso. Preservar o destino seguro originalmente solicitado. Reenvio somente se suportado pelo contrato confirmado do Wix; não inventar endpoint nem persistir senha.

**Aceite:** com respostas mockadas, cobrir os três estados, código inválido, token ausente/expirado, sucesso e retomada após nova abertura do login. Cadastro que já existe deve orientar para um login capaz de concluir a verificação. Criar `login-form.test.tsx`, executar `npm run test -- login-form.test.tsx` e manter os testes existentes de `members-auth.test.ts` passando.

## UX-04 — Newsletter precisa funcionar ou sair da interface

**Evidência:** `components/site-footer.tsx:114–127`: formulário sem action/onSubmit; input sem name. O navegador exibe campo e botão “Inscrever”, mas o código não registra inscrição.

**Impacto:** a pessoa fornece e-mail e não sabe se foi inscrita; a submissão padrão pode recarregar a página.

**Escopo:** bloco de newsletter do rodapé e eventual componente/action próprio. **Implementação recomendada sem provedor:** retirar temporariamente o formulário e a promessa de inscrição. Se a integração já estiver definida, adicionar validação, envio real, prevenção de duplicidade, estados de carregamento/sucesso/erro e anúncio acessível. Não gravar inscrições fictícias nem afirmar consentimento sem fluxo definido.

**Aceite:** nenhuma submissão sem processamento; falha preserva o e-mail e permite tentar novamente; sucesso é confirmado pelo serviço. Para remoção simples, inspeção manual é suficiente; se integrar, testar mock de sucesso, falha e inscrição repetida.

## UX-05 — Corrigir destinos do rodapé

**Evidência:** `components/site-footer.tsx:9–25`: Sustentabilidade, Trabalhe conosco, Central de ajuda, Trocas e devoluções, Política de privacidade, Termos de uso e três redes sociais usam `href="#"`. Confirmado no navegador na Home e no catálogo.

**Impacto:** links que parecem levar a ajuda ou informações da loja apenas alteram a âncora da página. Isso atrapalha especialmente a decisão de compra e o atendimento.

**Escopo:** listas de links e páginas reais aprovadas. **Implementação:** substituir por URLs verdadeiras fornecidas pelo responsável; até lá, remover entradas sem conteúdo/destino. Não inventar políticas comerciais ou textos legais. Uma entrada de ajuda pode levar ao contato se o rótulo deixar esse destino claro.

**Aceite:** os nove links têm destino útil ou foram removidos; navegação por Tab e Enter funciona; não há placeholder `href: "#"` nessas listas. Conferir visualmente desktop/mobile e executar `rg -n 'href: "#"' components/site-footer.tsx` (esperado: nenhuma ocorrência).

## UX-06 — Dar controle sobre movimento do banner da Home

**Evidência:** `app/(site)/_components/hero.tsx:23,110–119` avança a cada 3 segundos; a UI nas linhas 204–247 tem setas e indicadores, mas não pausa. O temporizador consulta movimento reduzido, porém `hero-banner-video.tsx:75–103` chama `video.play()` e usa autoplay/loop sem consultar essa preferência.

**Impacto:** o destino do link muda enquanto a pessoa lê ou mantém foco; quem pede menos movimento ainda recebe vídeo animado. Respeitar a preferência só nas transições não interrompe o conteúdo do vídeo.

**Escopo:** Hero e HeroBannerVideo, seus testes e imagens estáticas dos banners se necessárias. Fora de escopo: modificar os vídeos editoriais ou todos os carrosséis do site.

**Implementação:** controle visível e acessível de pausar/retomar, separando sua ação da navegação do banner. Suspender avanço quando o carrossel contém foco; definir comportamento consistente no hover e após interação manual. Em movimento reduzido, impedir reprodução automática e apresentar imagem estática útil. Reagir à mudança de preferência durante a sessão. Preservar swipe, links, fontes mobile e a escolha de codec.

**Aceite:** pausa mantém slide e mídia parados; teclado consegue pausar e navegar; foco não troca destino automaticamente; movimento reduzido mantém vídeo parado; retomada ocorre por ação explícita. Testar timers/matchMedia/play/pause mockados em `hero.test.tsx` e fazer inspeção desktop/mobile com a preferência ligada e desligada.

## UX-07 — Permitir edição natural da quantidade

**Evidência:** `app/(site)/carrinho/page.tsx:151–160`: value vem direto de `line.quantity`; onChange só aceita inteiro >= 1. Apagar o conteúdo produz zero e a alteração é rejeitada imediatamente.

**Cenário:** para trocar 1 por 2, a pessoa apaga 1 primeiro; o campo repõe 1, impedindo a sequência comum, especialmente incômoda no celular. Selecionar tudo e substituir continua possível, mas não resolve a fricção.

**Escopo:** campo de quantidade e `app/(site)/carrinho/page.test.tsx`. **Implementação:** manter rascunho textual por item enquanto se edita; aceitar vazio temporário; validar/confirmar em blur ou Enter. Vazio/inválido deve restaurar último valor válido ou mostrar erro claro, sem remover silenciosamente o item. Preservar remoção e desfazer existentes. Dar nome acessível que identifique o produto, não só “Qtd.”.

**Aceite:** apagar → digitar 2 → confirmar funciona; vazio, decimal e negativo não alteram indevidamente subtotal; duas linhas mantêm rascunhos independentes. Acrescentar regressões ao teste existente e executar `npm run test -- 'app/(site)/carrinho/page.test.tsx'`.

## UX-08 — Diferenciar falha operacional de resposta neutra na recuperação

**Evidência:** `app/(auth)/esqueci-senha/_components/esqueci-senha-form.tsx:31–40`: qualquer exceção é apenas registrada e depois mostra “enviamos um link”. `lib/wix/members-auth.ts:82–86` propaga falhas da requisição.

**Impacto:** em falha de rede/serviço a pessoa espera um e-mail que não foi enviado e não recebe orientação de tentar novamente.

**Escopo:** formulário e testes; classificação de erros da integração somente se necessária. **Implementação:** preservar resposta neutra para existência/não existência de cadastro; distinguir falhas operacionais que não revelem a existência da conta. Mostrar erro recuperável genérico nessas falhas. Limpar feedback antigo no começo de uma nova tentativa. Não expor erros internos do Wix.

**Aceite:** sucesso e conta inexistente continuam indistinguíveis; falha de transporte mostra tentativa não concluída e permite repetir; envio pendente não mantém sucesso anterior. Criar `esqueci-senha-form.test.tsx` e rodá-lo isoladamente.

## Melhorias opcionais — decidir antes de ampliar escopo

### OP-01 — Tornar o filtro de universo descobrível no próprio catálogo

`app/(site)/catalogo/page.tsx:15–23` já suporta `?universo=` e linhas 43–55 permitem limpar seleção, mas a página sem filtro não oferece seletor. Observado no catálogo mobile: informa “2 universos” sem uma ação para escolhê-los. Propor chips “Todos” e nomes dos universos, mantendo a URL como fonte de estado. Esforço S; risco baixo; confiança alta na ausência do controle. Com apenas oito títulos, busca textual e ordenações complexas podem esperar. Validar navegação voltar/avançar, URL compartilhada e seleção ativa por teclado.

### OP-02 — Facilitar retorno do pagamento sem preencher endereço de novo

`app/(site)/checkout/_components/checkout-content.tsx:56` define retorno para `/checkout`; `address-form.tsx:30–39` inicializa tudo vazio. Num retorno que monta um documento novo, o endereço se perde. Confirmar no ambiente Wix de teste antes de implementar, pois restauração do navegador pode variar. Considerar rascunho temporário por sessão, descartado ao concluir/sair da conta, ou aproveitar um checkout retomável do Wix. Não persistir endereço indefinidamente no localStorage. Esforço M, risco médio, confiança média no cenário externo.

### OP-03 — Melhorar a saída da manutenção de Minha conta

`app/(site)/perfil/page.tsx:12–13` explicitamente mantém a área em migração; login e cadastro direcionam para ela. Isso é uma decisão existente, não um defeito acidental a corrigir com uma área de pedidos inventada. Durante a manutenção, oferecer caminhos úteis e verificados para suporte de pedidos e continuar compras, além de alinhar expectativas antes do cadastro. Esforço S, risco baixo. A implementação completa de histórico/estante requer um projeto separado e dados reais.

## Verificação feita nesta revisão

- `npx tsc --noEmit --incremental false`: passou.
- `npm run test -- 'app/(site)/carrinho/page.test.tsx'`: passou, 5 testes. Não cobre automaticamente os novos cenários deste relatório.
- `npx eslint app components lib`: passou, sem erros ou avisos.
- `npm run lint`: falhou com 800 erros e 16.154 avisos; inclui `.agents`, `.claude/worktrees` e arquivos gerados. Não interpretar isso como 800 defeitos da aplicação. Corrigir o escopo do lint em trabalho separado, antes de exigir esse comando como gate limpo.
- Inspeção visual: Home desktop e catálogo mobile; leitura de estrutura acessível dessas páginas e rodapé. Fluxos externos não executados.

## Considerado e não recomendado nesta rodada

- Refazer lightbox, menu mobile ou desfazer do carrinho: já tratados no commit-base.
- Remover a manutenção de perfil sem backend pronto: decisão explícita; apenas melhorar orientação temporária.
- Reescrever catálogo em client-side ou adicionar framework de busca para oito itens: custo desproporcional.
- Tratar `docs/site/01-sitemap.md` como descrição atual: está desatualizado (afirma não haver carrinho). Usar o código como evidência e atualizar essa documentação quando a próxima rodada terminar.

Referência complementar de interface: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), consultadas nesta revisão. As prioridades e evidências acima são específicas deste repositório.

## Prompt para encaminhar ao Claude

> Leia `plans/001-revisao-usabilidade-2026-10-01.md` e confira cada evidência contra o código atual. Comece pelos itens P1, uma correção por vez, preservando o visual e as melhorias de bf9a131. Implemente as mitigações indicadas quando integrações estiverem ausentes; não simule envios, inscrições ou confirmação de pagamento. Crie testes de comportamento nos fluxos críticos e reporte validações e dependências pendentes. Não implemente OP-01 a OP-03 automaticamente: são propostas para priorização. Atualize os status em `plans/README.md` conforme concluir.
