"use client";

import { useRouter } from "next/navigation";

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
  const router = useRouter();

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // logout() já zera member/loggedIn e limpa a sessão local (finally)
      // antes de chamar a API do Wix — não sobra estado inconsistente pro
      // router herdar, então uma navegação client-side normal já basta.
      router.push("/");
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
