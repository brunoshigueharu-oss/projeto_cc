import type { Locale, Universe } from "@/lib/data/schemas";

/** Universo cujas coleções este texto explica (Graphic Novel / Contos). */
const PLANTA_UNIVERSE_SLUG = "necroplanta";

type CollectionsGuideSectionProps = {
  universe: Universe;
  locale: Locale;
};

const LABELS: Record<
  Locale,
  { heading: string; paragraphs: string[]; whereToStart: string; whereToStartBody: string }
> = {
  pt: {
    heading: "Entenda as Coleções do Planta",
    paragraphs: [
      "O universo de Planta é dividido em duas coleções principais: Graphic Novel e Contos do Planta.",
      "As duas linhas são complementares e expandem o universo da obra em diferentes direções, proporcionando experiências de leitura distintas. Embora compartilhem parte dos personagens principais, cada coleção apresenta seus próprios personagens, histórias e acontecimentos dentro do universo de Planta.",
      "Os Contos do Planta apresentam histórias mais curtas e fechadas em cada edição. Apesar de existir um arco maior conectando os volumes, esta coleção possui uma estrutura mais episódica, explorando personagens, situações e mistérios do universo de forma dinâmica e acessível.",
      "Já a coleção Graphic Novel acompanha o grande arco canônico do universo de Planta. As edições possuem histórias mais longas e complexas, permitindo que os acontecimentos se desenvolvam de forma mais ampla ao longo da narrativa.",
    ],
    whereToStart: "Por onde começar?",
    whereToStartBody:
      "Pela coleção que mais despertar o seu interesse. Ambas foram pensadas para orientar o leitor dentro do contexto dos personagens, permitindo diferentes portas de entrada para o universo.",
  },
  en: {
    heading: "Understanding the Plant Collections",
    paragraphs: [
      "The Plant universe is divided into two main collections: Graphic Novel and Tales of Plant.",
      "Both lines complement each other and expand the work's universe in different directions, offering distinct reading experiences. While they share some of the main characters, each collection features its own characters, stories, and events within the Plant universe.",
      "Tales of Plant presents shorter, self-contained stories in each edition. Even though a larger arc connects the volumes, this collection has a more episodic structure, exploring the universe's characters, situations, and mysteries in a dynamic and accessible way.",
      "The Graphic Novel collection, on the other hand, follows the great canonical arc of the Plant universe. These editions feature longer, more complex stories, allowing events to unfold more broadly throughout the narrative.",
    ],
    whereToStart: "Where should I start?",
    whereToStartBody:
      "Start with whichever collection interests you most. Both were designed to guide readers through the characters' context, offering different entry points into the universe.",
  },
};

/**
 * Seção institucional estática ("Entenda as Coleções do Planta" no Figma).
 *
 * O texto é específico do universo de Planta — fala das coleções Graphic Novel
 * e Contos do Planta —, então só renderiza nos livros desse universo. Em
 * Robô de Madeira, Yanayag e afins a seção some (retorna `null`), em vez de
 * repetir uma explicação que não vale para o título aberto.
 */
export function CollectionsGuideSection({
  universe,
  locale,
}: CollectionsGuideSectionProps) {
  if (universe.slug !== PLANTA_UNIVERSE_SLUG) {
    return null;
  }

  const labels = LABELS[locale];

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 py-20 sm:px-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            {labels.heading}
          </h2>
          {labels.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-lg font-serif leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
          <div className="flex flex-col gap-2">
            <p className="max-w-lg font-serif font-semibold leading-relaxed text-foreground">
              {labels.whereToStart}
            </p>
            <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
              {labels.whereToStartBody}
            </p>
          </div>
        </div>

        {/* Sem cor de fundo de propósito: o vídeo é branco puro em todas as
            bordas, igual ao fundo da página. Um `bg-*` aqui não fica escondido
            atrás do vídeo — ele vaza nos arcos antialiasados dos cantos
            arredondados, e no Safari (que compõe a camada de vídeo à parte e
            clipa o raio de forma mais grosseira) vira uma borda visível
            contornando o vídeo. */}
        <div
          aria-hidden="true"
          className="relative aspect-[3/4] w-full max-w-sm shrink-0 overflow-hidden rounded-2xl lg:w-[420px]"
        >
          <video
            className="h-full w-full object-cover"
            src="/videos/colecoes/planta-rotacao.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </section>
  );
}
