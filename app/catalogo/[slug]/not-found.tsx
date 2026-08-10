import Link from "next/link";

import { Seal } from "@/components/seal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookNotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
      <Seal className="size-16" aria-hidden="true" />
      <h1 className="mt-8 font-display text-4xl text-foreground">
        Este título não está no catálogo.
      </h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">
        Ou a página mudou de endereço, ou a tiragem nunca chegou a existir.
      </p>
      <Link
        href="/catalogo"
        className={cn(
          buttonVariants({ size: "lg" }),
          "mt-10 h-11 rounded-full px-7",
        )}
      >
        Voltar ao catálogo
      </Link>
    </section>
  );
}
