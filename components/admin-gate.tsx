"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useMember } from "@/lib/wix/member-context";
import { getAccessToken } from "@/lib/wix/client";

type CheckState = "checking" | "allowed" | "denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useMember();
  const [state, setState] = useState<CheckState>("checking");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!loggedIn) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/check", {
          method: "POST",
          headers: { Authorization: token },
        });
        const data = await res.json().catch(() => ({ isAdmin: false }));
        if (cancelled) return;
        if (data.isAdmin) {
          setState("allowed");
        } else {
          setState("denied");
          router.replace("/");
        }
      } catch {
        if (cancelled) return;
        setState("denied");
        router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, loggedIn, router, pathname]);

  if (state !== "allowed") {
    return <div className="p-12 text-center text-muted-foreground">Verificando acesso…</div>;
  }

  return <>{children}</>;
}
