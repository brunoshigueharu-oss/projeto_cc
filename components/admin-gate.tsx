"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useMember } from "@/lib/wix/member-context";
import { getAccessToken } from "@/lib/wix/client";

type CheckState = "checking" | "allowed" | "denied";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { loggedIn, loading } = useMember();
  const [state, setState] = useState<CheckState>("checking");
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    (async () => {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, loggedIn, router]);

  if (state !== "allowed") {
    return <div className="p-12 text-center text-muted-foreground">Verificando acesso…</div>;
  }

  return <>{children}</>;
}
