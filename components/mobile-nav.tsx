"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Menu, X } from "lucide-react";

import { useCart } from "@/lib/cart/cart-context";
import { NAV_LINKS } from "@/lib/nav-links";
import { SignOutButton } from "./sign-out-button";
import { NavLink } from "./nav-link";

const PANEL_LINK_CLASS =
  "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/**
 * Menu de navegação para telas estreitas.
 *
 * É um Client Component de propósito: com `<details>` o painel continuava
 * aberto por cima da página nova depois de uma navegação client-side. Aqui o
 * estado é fechado no clique do link, então a navegação sempre limpa o menu.
 */
export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const { itemCount } = useCart();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  function handleClose() {
    if (panelRef.current?.contains(document.activeElement)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        // Restore focus before the pointer's default action focuses its target.
        if (panelRef.current?.contains(document.activeElement)) {
          triggerRef.current?.focus({ preventScroll: true });
        }
        setIsOpen(false);
      }
    }

    function dismissOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        triggerRef.current?.focus({ preventScroll: true });
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [isOpen]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const fromTrigger = event.target === triggerRef.current;
    if (fromTrigger && (event.key === "Home" || event.key === "End")) return;
    event.preventDefault();
    const links = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? [],
    );
    if (!links.length) return;
    if (!isOpen) {
      // Commit visibility and inert before moving keyboard focus into the panel.
      flushSync(() => setIsOpen(true));
    }
    const current = links.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "Home" ? 0
      : event.key === "End" ? links.length - 1
      : event.key === "ArrowDown" ? (current + 1) % links.length
      : (current < 0 ? links.length - 1 : (current - 1 + links.length) % links.length);
    links[next].focus({ preventScroll: true });
  }

  return (
    <div
      ref={rootRef}
      className="relative md:hidden"
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
      >
        {isOpen ? (
          <X className="size-[18px]" aria-hidden="true" />
        ) : (
          <Menu className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      <nav
        ref={panelRef}
        id={panelId}
        inert={!isOpen}
        aria-hidden={!isOpen}
        style={{ visibility: isOpen ? "visible" : "hidden" }}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a, button")) handleClose();
        }}
        aria-label="Navegação (menu)"
        className={`absolute right-0 top-12 flex w-48 origin-top-right flex-col gap-1 rounded-lg border border-border bg-card p-2 shadow-lg transition-[opacity,scale,visibility] duration-150 ease-out motion-reduce:transition-none ${isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}
      >
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            className={PANEL_LINK_CLASS}
            activeClassName="bg-muted text-primary"
          >
            {link.label}
          </NavLink>
        ))}
        <NavLink
          href="/carrinho"
          className={PANEL_LINK_CLASS}
          activeClassName="bg-muted text-primary"
        >
          Carrinho ({itemCount})
        </NavLink>
        <NavLink
          href={isAuthenticated ? "/perfil" : "/login"}
          className={PANEL_LINK_CLASS}
          activeClassName="bg-muted text-primary"
        >
          Minha conta
        </NavLink>
        {isAuthenticated ? (
          <SignOutButton className={`w-full text-left ${PANEL_LINK_CLASS}`}>
            Sair
          </SignOutButton>
        ) : null}
      </nav>
    </div>
  );
}
