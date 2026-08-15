import type { Universe } from "@/lib/data/schemas";

/** Universo cujas coleções este texto explica (Graphic Novel / Contos). */
const PLANTA_UNIVERSE_SLUG = "necroplanta";

type CollectionsGuideSectionProps = {
  universe: Universe;
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
}: CollectionsGuideSectionProps) {
  if (universe.slug !== PLANTA_UNIVERSE_SLUG) {
    return null;
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-4 py-20 sm:px-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Entenda as Coleções do Planta
          </h2>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            O universo de Planta é dividido em duas coleções principais:
            Graphic Novel e Contos do Planta.
          </p>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            As duas linhas são complementares e expandem o universo da obra
            em diferentes direções, proporcionando experiências de leitura
            distintas. Embora compartilhem parte dos personagens principais,
            cada coleção apresenta seus próprios personagens, histórias e
            acontecimentos dentro do universo de Planta.
          </p>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            Os Contos do Planta apresentam histórias mais curtas e fechadas
            em cada edição. Apesar de existir um arco maior conectando os
            volumes, esta coleção possui uma estrutura mais episódica,
            explorando personagens, situações e mistérios do universo de
            forma dinâmica e acessível.
          </p>
          <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
            Já a coleção Graphic Novel acompanha o grande arco canônico do
            universo de Planta. As edições possuem histórias mais longas e
            complexas, permitindo que os acontecimentos se desenvolvam de
            forma mais ampla ao longo da narrativa.
          </p>
          <div className="flex flex-col gap-2">
            <p className="max-w-lg font-serif font-semibold leading-relaxed text-foreground">
              Por onde começar?
            </p>
            <p className="max-w-lg font-serif leading-relaxed text-muted-foreground">
              Pela coleção que mais despertar o seu interesse. Ambas foram
              pensadas para orientar o leitor dentro do contexto dos
              personagens, permitindo diferentes portas de entrada para o
              universo.
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
