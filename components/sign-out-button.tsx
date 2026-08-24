"use client";

import { logout } from "@/lib/wix/members-auth";

export function SignOutButton({
  className,
  children,
  "aria-label": ariaLabel,
}: {
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => logout()}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
