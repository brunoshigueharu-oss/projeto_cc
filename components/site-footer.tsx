import Link from "next/link";

import { NAV_LINKS } from "@/lib/nav-links";
import { Seal } from "./seal";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Seal className="size-6 text-primary" />
          <span className="font-display text-lg text-foreground">Hocus Pocus</span>
        </div>

        <nav aria-label="Navegação (rodapé)" className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Hocus Pocus. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
