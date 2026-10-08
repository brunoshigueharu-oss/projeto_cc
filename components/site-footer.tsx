import Link from "next/link";

import { NAV_LINKS } from "@/lib/nav-links";
import { Seal } from "./seal";
import { Wordmark } from "./wordmark";

// Só páginas que existem. Links de ajuda, políticas e redes sociais voltam
// quando houver destino real para cada um, nunca como link vazio.
const FOOTER_NAV_LINKS = NAV_LINKS.filter(
  (link) => link.href !== "/" && link.href !== "/contato",
);

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Seal className="size-8" />
            <Wordmark className="h-6 w-auto text-foreground" />
          </Link>
          <p className="max-w-xs font-serif text-sm text-muted-foreground">
            Universos foram feitos para serem explorados. Conheça nossas obras
            e mergulhe de cabeça.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-6 text-sm">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Navegação
            </h3>
            <nav aria-label="Rodapé" className="flex flex-col gap-3">
              {FOOTER_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-6 text-sm">
            <h3 className="font-display text-sm font-bold uppercase text-foreground">
              Contato
            </h3>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <a
                href="mailto:pedidos@hocuspocus.com.br"
                className="font-mono transition-colors hover:text-foreground"
              >
                pedidos@hocuspocus.com.br
              </a>
              <Link href="/contato" className="transition-colors hover:text-foreground">
                Ver todos os canais
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Hocus Pocus. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Pix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
