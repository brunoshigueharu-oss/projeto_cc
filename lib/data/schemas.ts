import { z } from "zod";

/**
 * Contrato de dados de todo o site.
 *
 * Os arrays em `universes.ts` / `books.ts` / `campaigns.ts` são validados no
 * topo do módulo (`schema.parse(...)`), que roda uma única vez por processo —
 * em rota estática, roda no `next build` e nunca mais. Um slug digitado errado
 * derruba o boot em vez de virar página em branco.
 */

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Slug deve ser ASCII em kebab-case (sem acentos)");

/** Tonalidades dos universos. Vira classe literal no componente (ver nota abaixo). */
export const toneSchema = z.enum(["garnet", "navy", "brown", "forest"]);
export type Tone = z.infer<typeof toneSchema>;

export const universeSchema = z.object({
  slug,
  /** Alimenta o "Nº 01" em font-mono nos cards. */
  order: z.number().int().positive(),
  name: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  tone: toneSchema,
});
export type Universe = z.infer<typeof universeSchema>;

export const bookSchema = z.object({
  slug,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  universeSlug: slug,
  author: z.object({
    name: z.string().min(1),
    /** Opcional: nem todo autor cadastrado já tem bio recebida da editora. */
    bio: z.string().min(1).optional(),
  }),
  /** Opcional: ficha de catálogo pode chegar antes da sinopse final. */
  synopsis: z.string().min(1).optional(),
  /** Trecho curto do livro, exibido em destaque na página de detalhe. */
  excerpt: z.string().optional(),
  coverAlt: z.string().min(1),
  coverTone: toneSchema,
  /** Preview em vídeo (mudo, loop) que substitui a capa estática no card. */
  coverVideoSrc: z.string().optional(),
  /** Reduz o vídeo dentro do quadro (0–1) — capas de caixa/estojo, mais largas que um livro. */
  coverVideoScale: z.number().positive().max(1).optional(),
  /** Opcional: outras fotos do livro (miolo, verso, detalhes), exibidas como galeria abaixo da capa. */
  gallery: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
      }),
    )
    .optional(),
  /** Opcional: ficha técnica completa (ISBN, dimensões etc.) chega depois do cadastro inicial. */
  specs: z
    .object({
      pages: z.number().int().positive(),
      isbn: z.string().regex(/^\d{3}-\d{10}$/, "ISBN-13 no formato 978-XXXXXXXXXX"),
      format: z.enum(["Capa dura", "Brochura", "Digital"]),
      dimensions: z.string().min(1),
      language: z.string().default("Português"),
      edition: z.string().min(1),
      publishedAt: z.iso.date(),
    })
    .optional(),
  /** Em centavos, para não carregar float. Formatação só em lib/format.ts. */
  price: z.object({
    amount: z.number().int().nonnegative(),
    currency: z.literal("BRL"),
  }),
  /** Opcional: link de compra chega junto da ficha técnica. */
  buyUrl: z.url().optional(),
  /** Default "disponivel": status real por título chega junto da ficha técnica. */
  status: z.enum(["disponivel", "pre-venda", "esgotado"]).default("disponivel"),
  featured: z.boolean().default(false),
  /** Opcional: item avulso (ex. exemplar autografado) vendido junto do livro. */
  upsell: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      price: z.object({ amount: z.number().int().nonnegative(), currency: z.literal("BRL") }),
      ctaLabel: z.string().min(1).default("Adicionar ao pedido"),
    })
    .optional(),
});
export type Book = z.infer<typeof bookSchema>;

export const campaignSchema = z.object({
  slug,
  title: z.string().min(1),
  kicker: z.string().min(1),
  description: z.string().min(1),
  kind: z.enum(["lancamento", "pre-venda", "evento", "assinatura"]),
  startsAt: z.iso.date(),
  endsAt: z.iso.date().nullable(),
  /**
   * Status é dado explícito, não derivado de `new Date()`: em Server Component
   * estático a data congela no build e a campanha ficaria "ativa" para sempre.
   */
  status: z.enum(["ativa", "em-breve", "encerrada"]),
  tone: toneSchema,
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
  relatedBookSlugs: z.array(slug).default([]),
});
export type Campaign = z.infer<typeof campaignSchema>;
