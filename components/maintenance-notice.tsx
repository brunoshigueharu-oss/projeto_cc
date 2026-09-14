import Link from "next/link";

import { Seal } from "@/components/seal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MaintenanceNoticeProps = {
  title?: string;
  description?: string;
};

/**
 * Tela de "página fora do ar": renderize no lugar do conteúdo de qualquer
 * `page.tsx` que precise sair do ar temporariamente. Header e footer do
 * layout continuam, só o miolo é substituído.
 */
export function MaintenanceNotice({
  title = "Hocus e Pocus estão trabalhando nesta área",
  description = "Estamos preparando esta página com calma. Volte daqui a pouco.",
}: MaintenanceNoticeProps) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
      <Seal className="size-16" aria-hidden="true" />

      <div className="mt-8 flex h-4 items-end gap-2" aria-hidden="true">
        <span className="size-2.5 animate-working-dot rounded-full bg-primary" />
        <span className="size-2.5 animate-working-dot rounded-full bg-primary delay-200" />
        <span className="size-2.5 animate-working-dot rounded-full bg-primary delay-400" />
      </div>

      <h1 className="mt-6 text-balance font-display text-3xl text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-4 font-serif text-lg text-muted-foreground">{description}</p>

      <Link
        href="/"
        className={cn(buttonVariants({ size: "lg" }), "mt-10 h-11 rounded-full px-7")}
      >
        Voltar ao início
      </Link>
    </section>
  );
}
