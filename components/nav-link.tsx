"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
  children: ReactNode;
};

/**
 * Link de navegação que marca a rota atual com `aria-current="page"`.
 *
 * É o único pedaço cliente do header — isolado aqui para que `SiteHeader` e
 * `SiteFooter` continuem sendo Server Components.
 */
export function NavLink({
  href,
  className,
  activeClassName,
  onClick,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  // A Home só casa exatamente; as demais também marcam suas sub-rotas
  // (ex.: /catalogo/algum-livro mantém "Catálogo" ativo).
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
