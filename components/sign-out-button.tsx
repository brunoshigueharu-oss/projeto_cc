"use client";

import { useMember } from "@/lib/wix/member-context";

export function SignOutButton({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const { logout } = useMember();

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // Hard navigation deliberada: fallback só usado quando a chamada de
      // logout falhou, então preferimos garantir a saída da página em vez de
      // depender do client router (que pode estar num estado inconsistente).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
