import Link from "next/link";
import { CircleUserRound, Menu, ShoppingBag } from "lucide-react";

import { NAV_LINKS } from "./nav-links";
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

        <nav aria-label="Navegação principal" className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Carrinho"
            className="inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingBag className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Minha conta"
            className="hidden size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            <CircleUserRound className="size-[18px]" aria-hidden="true" />
          </button>

          <details className="group relative sm:hidden">
            <summary
              aria-label="Abrir menu"
              className="inline-flex size-9 list-none items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-[18px]" aria-hidden="true" />
            </summary>
            <nav
              aria-label="Navegação (menu)"
              className="absolute right-0 top-12 flex w-48 flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-lg"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/conta"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Minha conta
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
