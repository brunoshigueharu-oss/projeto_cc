# Visão geral do projeto

## Objetivo

Migrar o site institucional da editora, hoje publicado no Wix Studio (ainda
incompleto), para um projeto próprio em Next.js hospedado na Vercel — usando
o Wix como referência de direção geral de estrutura e seções, não como fonte
de conteúdo ou design definitivo a ser replicado.

## Links de referência

- Site atual (Wix Studio): https://hocusp1r1studio.wixstudio.com/website
- Arquivo Figma do projeto: https://www.figma.com/design/WBcItkgW0YfgFUnDPj5G3L/Projeto-Figma-Claude
  - Estado em 2026-08-10: arquivo criado mas vazio (uma página "Page 1",
    sem nós) — o design será construído do zero dentro dele, não migrado
    de um design existente.

## Decisões confirmadas

- **Fidelidade visual:** usar o site Wix atual como referência de direção
  geral (seções, tipo de conteúdo, ideia de layout) — não uma migração
  pixel-a-pixel. O site Wix está incompleto/em progresso, então **não**
  vamos extrair textos e imagens reais dele como fonte definitiva; conteúdo
  final (textos, imagens, lista de livros) será definido durante cada ciclo
  de design, não copiado do Wix.
- **Hospedagem:** Vercel.
- **Conteúdo do catálogo/campanhas:** muda com pouca frequência → sem
  CMS/painel administrativo por enquanto. Dados estáticos tipados com Zod
  ficam em `lib/data/` (fonte única), consumidos pela camada `_data-access/`
  de cada rota — sem pular esse padrão já estabelecido no projeto.
- **Arquitetura de rotas:** segue as regras já definidas em `CLAUDE.md` e
  `.claude/rules/rules-global.md` — Server Components por padrão, cada rota
  com `page.tsx` + `_components/` + `_actions/` + `_data-access/`.

## Stack alvo

Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS 4 + shadcn +
React Hook Form + Zod, conforme `CLAUDE.md`.

## Fluxo de trabalho

Resumo: sitemap no FigJam → design system no Figma ("Foundations") → dados
estáticos tipados → ciclo por seção do site (brainstorming → design no
Figma → leitura via `figma-design-to-code` → plano → implementação →
validação → commit), começando por Home.

O plano completo que originou este documento fica em
`~/.claude/plans/eu-tenho-um-site-vivid-beacon.md` — é um artefato local
desta sessão (não versionado no repositório), útil como histórico, mas não
deve ser tratado como referência portátil entre máquinas/sessões.
