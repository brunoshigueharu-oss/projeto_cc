"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { NavLink } from "./nav-link";

const PANEL_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground";

/**
 * Menu de navegação para telas estreitas.
 *
 * É um Client Component de propósito: com `<details>` o painel continuava
 * aberto por cima da página nova depois de uma navegação client-side. Aqui o
 * estado é fechado no clique do link, então a navegação sempre limpa o menu.
 */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      >
        {isOpen ? (
          <X className="size-[18px]" aria-hidden="true" />
        ) : (
          <Menu className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <nav
          id="mobile-nav-panel"
          aria-label="Navegação (menu)"
          className="absolute right-0 top-12 flex w-48 flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-lg"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              onClick={handleClose}
              className={PANEL_LINK_CLASS}
              activeClassName="bg-muted text-primary"
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            href="/perfil"
            onClick={handleClose}
            className={PANEL_LINK_CLASS}
            activeClassName="bg-muted text-primary"
          >
            Minha conta
          </NavLink>
        </nav>
      ) : null}
    </div>
  );
}
