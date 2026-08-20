import Link from "next/link";
import { CircleUserRound, LogOut } from "lucide-react";

import { NAV_LINKS } from "@/lib/nav-links";
import { signOut } from "@/lib/supabase/actions/sign-out";
import { createClient } from "@/lib/supabase/server";
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

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.name as string | undefined)?.trim() || user?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Seal className="size-8" />
          <Wordmark className="h-6 w-auto text-foreground" />
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
          <CartLink className={ICON_LINK_CLASS} />

          {user ? (
            <>
              <Link
                href="/perfil"
                aria-label="Minha conta"
                className={`${ICON_LINK_CLASS} text-xs font-medium`}
              >
                {getInitials(displayName)}
              </Link>
              <form action={signOut}>
                <button type="submit" aria-label="Sair" className={ICON_LINK_CLASS}>
                  <LogOut className="size-[18px]" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" aria-label="Entrar" className={ICON_LINK_CLASS}>
              <CircleUserRound className="size-[18px]" aria-hidden="true" />
            </Link>
          )}

          <MobileNav isAuthenticated={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
