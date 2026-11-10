# Regras de código (só quando mexer no app Next.js)

Complementa o CLAUDE.md. Não se aplica a pedidos de ilustração.

## Estrutura de páginas

```
app/<rota>/
├── page.tsx          # Server Component: busca dados (via _data-access) e passa por props
├── _components/      # componentes só desta rota (content.tsx = Client Component principal)
├── _actions/         # Server Actions ("use server"), validam input com Zod
└── _data-access/     # leitura de dados, sempre no servidor
```

- Componente usado só numa rota → `_components/` dela. Reuso amplo → `components/`
  (na dúvida, pergunte antes de globalizar).
- Server Component por padrão; `"use client"` só para estado, efeitos, eventos ou
  APIs do browser. Client Components não buscam dados nem acessam o banco.
- Lógica de negócio fora dos componentes de UI.

## Código

- TypeScript estrito: tipar props, inputs e retornos de actions.
- Formulários: shadcn (`field`) + React Hook Form + Zod.
- Nomes: handlers `handleX`, booleanos `isX`/`hasX`/`canX`, hooks `useX`; palavras
  completas (exceto `err`, `req`, `res`, `props`, `ref`).
- Sem números mágicos; componentes pequenos e com uma responsabilidade.

## Testes

- Jest + React Testing Library, um arquivo por vez: `npm run test -- NomeDoArquivo`.
