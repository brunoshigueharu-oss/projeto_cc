import Link from "next/link";
import { CircleUserRound } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { Seal } from "./seal";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Seal className="size-8 text-primary" />
          <span className="font-display text-xl tracking-wide text-foreground">
            Hocus Pocus
          </span>
        </Link>

        {/* `md` e não `sm`: com cinco itens a navegação estoura entre 640px e 768px. */}
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/perfil"
            aria-label="Minha conta"
            className="hidden size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          >
            <CircleUserRound className="size-[18px]" aria-hidden="true" />
          </Link>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
