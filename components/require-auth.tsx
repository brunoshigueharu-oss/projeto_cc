// components/require-auth.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMember } from "@/lib/wix/member-context";

/**
 * Gate client-side pra rotas de membro (`/perfil`, `/carrinho`, `/checkout`).
 * Sem cookie de sessão pro servidor ver, não dá pra bloquear antes de
 * renderizar (ver spec, decisão 2) — o redirect acontece assim que o check
 * client-side resolve, com uma tela de carregando no meio.
 */
export function RequireAuth({
  children,
  fallback = "/login",
}: {
  children: React.ReactNode;
  fallback?: string;
}) {
  const { loggedIn, loading } = useMember();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !loggedIn) {
      router.replace(`${fallback}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, loggedIn, router, fallback, pathname]);

  if (loading || !loggedIn) {
    return (
      <div className="p-12 text-center text-muted-foreground">Carregando…</div>
    );
  }

  return <>{children}</>;
}
