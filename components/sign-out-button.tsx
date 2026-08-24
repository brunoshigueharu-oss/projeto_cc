"use client";

import { logout } from "@/lib/wix/members-auth";

export function SignOutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => logout()} className={className}>
      {children}
    </button>
  );
}
