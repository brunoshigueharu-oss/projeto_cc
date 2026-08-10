import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Seal } from "@/components/seal";
import { UniverseCard } from "@/components/universe-card";
import { getUniverses } from "../_data-access/get-universes";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "A Hocus Pocus publica ficção sombria ilustrada em tiragens curtas, com cada universo tratado como um objeto próprio.",
};

const PRINCIPLES = [
  {
    title: "A capa vem antes do fim",
    description:
      "Cada livro é desenhado enquanto ainda está sendo escrito. A imagem não ilustra a história — ela decide para onde a história precisa ir.",
  },
  {
    title: "Tiragem curta, sem reimpressão automática",
    description:
      "Publicamos pouco e numerado. Quando um título esgota, ele só volta se houver motivo editorial, nunca só por demanda.",
  },
  {
    title: "Universo antes de título",
    description:
      "Nenhum livro nasce sozinho. Ele entra num universo que já tem regras, vocabulário e limites — e precisa respeitá-los.",
  },
];

export default async function SobrePage() {
  const universes = await getUniverses();

  return (
    <>
      <PageHeader
        eyebrow="Sobre"
        title="Uma editora pequena, deliberadamente."
        intro="A Hocus Pocus existe para publicar ficção sombria ilustrada do jeito que ela pede: devagar, em pouca quantidade e com o objeto importando tanto quanto o texto."
      />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-prose">
          <p className="font-serif text-xl leading-relaxed text-foreground/85 sm:text-2xl">
            Começamos porque as histórias que queríamos ler não cabiam no formato
            em que estavam sendo publicadas.
          </p>
          <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
            Horror botânico, autômatos de madeira, gabinetes de curiosidade —
            temas que dependem de imagem tanto quanto de frase, e que num
            paperback comum perdem metade do que têm. A saída foi tratar cada
            livro como um objeto: papel escolhido título a título, capa
            desenhada à mão, tiragem que cabe numa sala.
          </p>
          <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
            Isso limita quanto publicamos por ano. É o ponto.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            Como trabalhamos
          </h2>

          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.title}>
                <span className="font-mono text-xs tracking-[0.2em] text-primary tabular-nums">
                  Nº {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl leading-tight text-foreground">
                  {principle.title}
                </h3>
                <p className="mt-3 font-serif leading-relaxed text-muted-foreground">
                  {principle.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          Os universos
        </h2>
        <p className="mt-3 max-w-xl font-serif text-muted-foreground">
          Quatro linhas editoriais, cada uma com sua própria mitologia.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {universes.map((universe) => (
            <li key={universe.slug}>
              <UniverseCard universe={universe} />
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden border-t border-border">
        <Seal
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 text-foreground/[0.04]"
        />
        <div className="relative mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            Quer publicar conosco?
          </h2>
          <p className="mt-4 font-serif text-lg text-muted-foreground">
            Lemos tudo o que chega, mas respondemos devagar — pelo mesmo motivo
            que publicamos devagar.
          </p>
          <Link
            href="/contato"
            className="mt-8 inline-flex text-xs font-medium uppercase tracking-[0.2em] text-primary underline-offset-4 hover:underline"
          >
            Falar com a editora →
          </Link>
        </div>
      </section>
    </>
  );
}
