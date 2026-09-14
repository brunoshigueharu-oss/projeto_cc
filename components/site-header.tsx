"use client";

import Link from "next/link";
import { CircleUserRound, LogOut } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { useMember } from "@/lib/wix/member-context";
import { SignOutButton } from "./sign-out-button";
import { CartLink } from "./cart-link";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { Seal } from "./seal";
import { Wordmark } from "./wordmark";

const ICON_LINK_CLASS =
  "hidden size-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground md:inline-flex";

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SiteHeader() {
  const { loggedIn, member, loading } = useMember();

  const displayName =
    member?.profile?.nickname || member?.loginEmail || "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <Seal className="size-8" />
          <Wordmark className="h-6 w-auto text-foreground" />
        </Link>

        {/* `md` e não `sm`: com cinco itens a navegação estoura entre 640px e 768px. */}
        {/* Grid de 3 colunas com as pontas em `1fr`: como elas dividem o
            espaço sobrante igualmente, a coluna central (auto) fica
            centralizada de verdade, mesmo o bloco de ícones sendo mais largo
            que o logo (com `auto_1fr_auto` ou flex justify-between o centro
            do nav fica deslocado pela diferença de largura entre as pontas). */}
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

        <div className="flex items-center justify-end gap-1 justify-self-end">
          <CartLink className={ICON_LINK_CLASS} />

          {!loading && loggedIn ? (
            <>
              <Link
                href="/perfil"
                aria-label="Minha conta"
                className={`${ICON_LINK_CLASS} text-xs font-medium`}
              >
                {getInitials(displayName || "Conta")}
              </Link>
              <SignOutButton className={ICON_LINK_CLASS} aria-label="Sair">
                <LogOut className="size-[18px]" aria-hidden="true" />
              </SignOutButton>
            </>
          ) : (
            <Link href="/login" aria-label="Entrar" className={ICON_LINK_CLASS}>
              <CircleUserRound className="size-[18px]" aria-hidden="true" />
            </Link>
          )}

          <MobileNav isAuthenticated={!loading && loggedIn} />
        </div>
      </div>
    </header>
  );
}
