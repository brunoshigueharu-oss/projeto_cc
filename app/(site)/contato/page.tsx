import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ContactForm } from "./_components/contact-form";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Hocus Pocus — envio de originais, pedidos, imprensa e demais assuntos.",
};

const CHANNELS = [
  {
    label: "Originais",
    value: "originais@hocuspocus.com.br",
    note: "Envie sinopse, três capítulos e uma linha sobre o universo.",
  },
  {
    label: "Pedidos e envios",
    value: "pedidos@hocuspocus.com.br",
    note: "Dúvida sobre rastreio, troca ou exemplar danificado.",
  },
  {
    label: "Imprensa",
    value: "imprensa@hocuspocus.com.br",
    note: "Resenhas, entrevistas e material de divulgação.",
  },
];

export default function ContatoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a editora."
        intro="Lemos tudo o que chega. Respondemos devagar, pelo mesmo motivo que publicamos devagar."
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-display text-2xl text-foreground">
              Canais diretos
            </h2>
            <dl className="mt-8 flex flex-col gap-8">
              {CHANNELS.map((channel) => (
                <div key={channel.label}>
                  <dt className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                    {channel.label}
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={`mailto:${channel.value}`}
                      className="font-mono text-sm text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {channel.value}
                    </a>
                    <p className="mt-1 font-serif text-sm text-muted-foreground">
                      {channel.note}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 border-t border-border pt-8">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Prazo de resposta
              </h3>
              <p className="mt-2 font-serif text-sm text-muted-foreground">
                Até cinco dias úteis para pedidos e imprensa. Originais levam
                mais: a leitura é feita pela equipe editorial, não por triagem
                automática.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl text-foreground">
              Enviar uma mensagem
            </h2>
            <p className="mt-2 font-serif text-sm text-muted-foreground">
              Todos os campos são obrigatórios.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
